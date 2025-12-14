# frozen_string_literal: true

class RecipeImportService
  class ImportError < StandardError; end

  def initialize(url)
    @url = url
  end

  def import
    response = fetch_page
    parse_recipe(response.body)
  rescue HTTParty::Error, SocketError => e
    raise ImportError, "Failed to fetch URL: #{e.message}"
  rescue StandardError => e
    raise ImportError, "Failed to parse recipe: #{e.message}"
  end

  private

  def fetch_page
    HTTParty.get(@url, {
      headers: {
        'User-Agent' => 'RecipeBox/1.0 (Recipe Importer)'
      },
      timeout: 10
    })
  end

  def parse_recipe(html)
    doc = Nokogiri::HTML(html)

    # Try to find JSON-LD structured data first (most reliable)
    json_ld = extract_json_ld(doc)
    return json_ld if json_ld

    # Fall back to meta tags and common selectors
    {
      title: extract_title(doc),
      description: extract_description(doc),
      instructions: extract_instructions(doc),
      ingredients: extract_ingredients(doc),
      prep_time_minutes: extract_time(doc, 'prep'),
      cook_time_minutes: extract_time(doc, 'cook'),
      servings: extract_servings(doc),
      image_url: extract_image(doc),
      source_url: @url
    }
  end

  def extract_json_ld(doc)
    scripts = doc.css('script[type="application/ld+json"]')
    scripts.each do |script|
      begin
        data = JSON.parse(script.text)
        recipe = find_recipe_in_json_ld(data)
        return parse_json_ld_recipe(recipe) if recipe
      rescue JSON::ParserError
        next
      end
    end
    nil
  end

  def find_recipe_in_json_ld(data)
    return data if data.is_a?(Hash) && data['@type'] == 'Recipe'
    
    if data.is_a?(Hash) && data['@graph']
      data['@graph'].find { |item| item['@type'] == 'Recipe' }
    elsif data.is_a?(Array)
      data.find { |item| item['@type'] == 'Recipe' }
    end
  end

  def parse_json_ld_recipe(recipe)
    {
      title: recipe['name'],
      description: recipe['description'],
      instructions: parse_instructions(recipe['recipeInstructions']),
      ingredients: Array(recipe['recipeIngredient']),
      prep_time_minutes: parse_iso_duration(recipe['prepTime']),
      cook_time_minutes: parse_iso_duration(recipe['cookTime']),
      servings: parse_yield(recipe['recipeYield']),
      image_url: extract_image_from_json(recipe['image']),
      source_url: @url,
      nutritional_info: parse_nutrition(recipe['nutrition'])
    }
  end

  def parse_instructions(instructions)
    return '' unless instructions

    if instructions.is_a?(String)
      instructions
    elsif instructions.is_a?(Array)
      instructions.map do |inst|
        inst.is_a?(Hash) ? inst['text'] : inst
      end.compact.join("\n\n")
    else
      ''
    end
  end

  def parse_iso_duration(duration)
    return nil unless duration
    # Parse ISO 8601 duration (e.g., PT30M, PT1H30M)
    match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/)
    return nil unless match
    
    hours = match[1].to_i
    minutes = match[2].to_i
    hours * 60 + minutes
  end

  def parse_yield(recipe_yield)
    return nil unless recipe_yield
    yield_str = recipe_yield.is_a?(Array) ? recipe_yield.first : recipe_yield
    yield_str.to_s.scan(/\d+/).first&.to_i
  end

  def extract_image_from_json(image)
    return nil unless image
    return image if image.is_a?(String)
    return image['url'] if image.is_a?(Hash)
    return image.first if image.is_a?(Array) && image.first.is_a?(String)
    image.first['url'] if image.is_a?(Array) && image.first.is_a?(Hash)
  end

  def parse_nutrition(nutrition)
    return nil unless nutrition.is_a?(Hash)
    {
      calories: nutrition['calories']&.to_s&.gsub(/[^\d]/, '')&.to_i,
      protein: nutrition['proteinContent']&.to_s&.gsub(/[^\d.]/, '')&.to_f,
      carbohydrates: nutrition['carbohydrateContent']&.to_s&.gsub(/[^\d.]/, '')&.to_f,
      fat: nutrition['fatContent']&.to_s&.gsub(/[^\d.]/, '')&.to_f
    }
  end

  # Fallback methods for non-JSON-LD pages
  def extract_title(doc)
    doc.at_css('h1')&.text&.strip ||
      doc.at_css('meta[property="og:title"]')&.[]('content') ||
      doc.title
  end

  def extract_description(doc)
    doc.at_css('meta[name="description"]')&.[]('content') ||
      doc.at_css('meta[property="og:description"]')&.[]('content')
  end

  def extract_instructions(doc)
    instructions = doc.css('.instructions li, .recipe-instructions li, [itemprop="recipeInstructions"] li')
    return instructions.map(&:text).join("\n\n") if instructions.any?
    
    doc.at_css('.instructions, .recipe-instructions, [itemprop="recipeInstructions"]')&.text&.strip
  end

  def extract_ingredients(doc)
    doc.css('.ingredients li, .recipe-ingredients li, [itemprop="recipeIngredient"]')
       .map { |li| li.text.strip }
  end

  def extract_time(doc, type)
    selector = type == 'prep' ? '[itemprop="prepTime"]' : '[itemprop="cookTime"]'
    element = doc.at_css(selector)
    return nil unless element
    
    content = element['content'] || element['datetime']
    parse_iso_duration(content) if content
  end

  def extract_servings(doc)
    element = doc.at_css('[itemprop="recipeYield"]')
    return nil unless element
    element.text.scan(/\d+/).first&.to_i
  end

  def extract_image(doc)
    doc.at_css('meta[property="og:image"]')&.[]('content') ||
      doc.at_css('[itemprop="image"]')&.[]('src')
  end

  # Parses an ingredient string like "50g breadcrumbs" or "1/2 cup flour"
  # Returns a hash with :quantity, :unit, and :name
  def self.parse_ingredient(text)
    return { quantity: nil, unit: nil, name: text&.strip } if text.blank?
    
    match = INGREDIENT_REGEX.match(text.strip)
    return { quantity: nil, unit: nil, name: text } unless match

    quantity_str = match[:quantity]
    unit = match[:unit]
    name = match[:name].strip
    
    # Clean up name if it starts with 'of ' (e.g. "50g of flour")
    name = name.sub(/\Aof\s+/, '')

    {
      quantity: parse_quantity(quantity_str),
      unit: unit&.downcase&.singularize,
      name: name
    }
  end

  def self.parse_quantity(quantity_str)
    return nil if quantity_str.blank?

    # Handle unicode fractions
    quantity_str = normalize_unicode_fractions(quantity_str)

    begin
      if quantity_str.include?(' ') && quantity_str.include?('/')
        # Mixed fraction: "1 1/2"
        whole, fraction = quantity_str.split(' ')
        whole.to_f + Rational(fraction).to_f
      elsif quantity_str.include?('/')
        # Fraction: "1/2"
        Rational(quantity_str).to_f
      else
        # Decimal or Integer
        quantity_str.to_f
      end
    rescue ArgumentError, ZeroDivisionError
      nil
    end
  end

  def self.normalize_unicode_fractions(str)
    # Map common unicode fractions to ascii
    str.gsub(/[\u00BC-\u00BE\u2150-\u215E]/) do |char|
      case char
      when '¼' then ' 1/4'
      when '½' then ' 1/2'
      when '¾' then ' 3/4'
      when '⅓' then ' 1/3'
      when '⅔' then ' 2/3'
      when '⅕' then ' 1/5'
      when '⅖' then ' 2/5'
      when '⅗' then ' 3/5'
      when '⅘' then ' 4/5'
      when '⅙' then ' 1/6'
      when '⅚' then ' 5/6'
      when '⅛' then ' 1/8'
      when '⅜' then ' 3/8'
      when '⅝' then ' 5/8'
      when '⅞' then ' 7/8'
      else char
      end
    end.strip.squeeze(' ')
  end

  # Common units to look for (case insensitive), sorted by length descending for greedy matching
  PARSING_UNITS = [
    "tablespoons", "tablespoon", "teaspoons", "teaspoon", "fluid ounce", "fl oz",
    "gallons", "gallon", "litres", "liters", "litre", "liter", "handfuls", "handful",
    "packets", "packet", "bunches", "pinches", "sprigs", "cloves", "slices", "pieces",
    "quarts", "quart", "pints", "pint", "bunch", "pinch", "sprig", "clove", "slice",
    "piece", "cups", "tbsp", "inch", "jars", "cans", "bags", "tsp", "cup", "jar",
    "can", "box", "bag", "lbs", "oz", "ml", "kg", "lb", "mm", "cm", "g", "l"
  ].freeze

  # Regex to capture:
  # 1. Quantity (optional): integer, decimal, fraction (1/2), mixed fraction (1 1/2), or unicode fraction (½, 1 ½)
  # 2. Unit (optional): common units (g, kg, cup, etc.)
  # 3. Name: remaining text
  INGREDIENT_REGEX = %r{
    \A
    (?<quantity>
      (?:
        \d+\s*[\u00BC-\u00BE\u2150-\u215E] | # Number + Unicode fraction (e.g. 1 ½)
        [\u00BC-\u00BE\u2150-\u215E] |       # Just Unicode fraction (e.g. ½)
        \d+\s+\d+/\d+ |                      # Mixed fraction (e.g. 1 1/2)
        \d+/\d+ |                            # Fraction (e.g. 1/2)
        \d*\.?\d+                            # Decimal or Integer
      )
    )?
    \s*
    (?<unit>
      (?:#{Regexp.union(PARSING_UNITS.sort_by(&:length).reverse)})\b
    )?
    \s*
    (?<name>.*)
  \z
  }xi
end
