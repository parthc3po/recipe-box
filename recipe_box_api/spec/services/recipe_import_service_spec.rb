# frozen_string_literal: true

require 'rails_helper'

RSpec.describe RecipeImportService do
  describe '.parse_ingredient' do
    context 'with quantity and unit attached (no space)' do
      it 'parses "50g breadcrumbs"' do
        result = described_class.parse_ingredient('50g breadcrumbs')
        expect(result[:quantity]).to eq(50.0)
        expect(result[:unit]).to eq('g')
        expect(result[:name]).to eq('breadcrumbs')
      end

      it 'parses "400g tinned tomatoes"' do
        result = described_class.parse_ingredient('400g tinned tomatoes')
        expect(result[:quantity]).to eq(400.0)
        expect(result[:unit]).to eq('g')
        expect(result[:name]).to eq('tinned tomatoes')
      end

      it 'parses "250ml milk"' do
        result = described_class.parse_ingredient('250ml milk')
        expect(result[:quantity]).to eq(250.0)
        expect(result[:unit]).to eq('ml')
        expect(result[:name]).to eq('milk')
      end
    end

    context 'with quantity and unit separated by space' do
      it 'parses "1 cup flour"' do
        result = described_class.parse_ingredient('1 cup flour')
        expect(result[:quantity]).to eq(1.0)
        expect(result[:unit]).to eq('cup')
        expect(result[:name]).to eq('flour')
      end

      it 'parses "2 tbsp olive oil"' do
        result = described_class.parse_ingredient('2 tbsp olive oil')
        expect(result[:quantity]).to eq(2.0)
        expect(result[:unit]).to eq('tbsp')
        expect(result[:name]).to eq('olive oil')
      end
    end

    context 'with fractions' do
      it 'parses "1/2 cup flour"' do
        result = described_class.parse_ingredient('1/2 cup flour')
        expect(result[:quantity]).to eq(0.5)
        expect(result[:unit]).to eq('cup')
        expect(result[:name]).to eq('flour')
      end

      it 'parses "1/4 tsp salt"' do
        result = described_class.parse_ingredient('1/4 tsp salt')
        expect(result[:quantity]).to eq(0.25)
        expect(result[:unit]).to eq('tsp')
        expect(result[:name]).to eq('salt')
      end
    end

    context 'with unicode fractions' do
      it 'parses "½ cup milk"' do
        result = described_class.parse_ingredient('½ cup milk')
        expect(result[:quantity]).to eq(0.5)
        expect(result[:unit]).to eq('cup')
        expect(result[:name]).to eq('milk')
      end

      it 'parses "¼ tsp salt"' do
        result = described_class.parse_ingredient('¼ tsp salt')
        expect(result[:quantity]).to eq(0.25)
        expect(result[:unit]).to eq('tsp')
        expect(result[:name]).to eq('salt')
      end

      it 'parses mixed unicode "1 ½ tbsp butter"' do
        result = described_class.parse_ingredient('1 ½ tbsp butter')
        expect(result[:quantity]).to eq(1.5)
        expect(result[:unit]).to eq('tbsp')
        expect(result[:name]).to eq('butter')
      end

      it 'parses mixed unicode "2¼ cups flour"' do
        result = described_class.parse_ingredient('2¼ cups flour')
        expect(result[:quantity]).to eq(2.25)
        expect(result[:unit]).to eq('cup')
        expect(result[:name]).to eq('flour')
      end
    end

    context 'with mixed fractions' do
      it 'parses "1 1/2 cups sugar"' do
        result = described_class.parse_ingredient('1 1/2 cups sugar')
        expect(result[:quantity]).to eq(1.5)
        expect(result[:unit]).to eq('cup')
        expect(result[:name]).to eq('sugar')
      end

      it 'parses "2 1/4 cups flour"' do
        result = described_class.parse_ingredient('2 1/4 cups flour')
        expect(result[:quantity]).to eq(2.25)
        expect(result[:unit]).to eq('cup')
        expect(result[:name]).to eq('flour')
      end
    end

    context 'with decimal quantities' do
      it 'parses "2.5 kg chicken"' do
        result = described_class.parse_ingredient('2.5 kg chicken')
        expect(result[:quantity]).to eq(2.5)
        expect(result[:unit]).to eq('kg')
        expect(result[:name]).to eq('chicken')
      end
    end

    context 'without a recognized unit' do
      it 'parses "2 large eggs" without matching unit on "large"' do
        result = described_class.parse_ingredient('2 large eggs')
        expect(result[:quantity]).to eq(2.0)
        expect(result[:unit]).to be_nil
        expect(result[:name]).to eq('large eggs')
      end

      it 'parses "3 medium onions"' do
        result = described_class.parse_ingredient('3 medium onions')
        expect(result[:quantity]).to eq(3.0)
        expect(result[:unit]).to be_nil
        expect(result[:name]).to eq('medium onions')
      end
    end

    context 'with edge cases' do
      it 'returns original text as name when empty' do
        result = described_class.parse_ingredient('')
        expect(result[:quantity]).to be_nil
        expect(result[:unit]).to be_nil
        expect(result[:name]).to eq('')
      end

      it 'handles nil input' do
        result = described_class.parse_ingredient(nil)
        expect(result[:quantity]).to be_nil
        expect(result[:unit]).to be_nil
        expect(result[:name]).to be_nil
      end

      it 'handles text with no quantity' do
        result = described_class.parse_ingredient('salt and pepper to taste')
        expect(result[:quantity]).to be_nil
        expect(result[:unit]).to be_nil
        expect(result[:name]).to eq('salt and pepper to taste')
      end

      it 'parses "pinch of salt"' do
        result = described_class.parse_ingredient('1 pinch salt')
        expect(result[:quantity]).to eq(1.0)
        expect(result[:unit]).to eq('pinch')
        expect(result[:name]).to eq('salt')
      end
    end
  end
end
