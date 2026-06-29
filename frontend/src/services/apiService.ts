import { PriceListItem, IdentifiedItem } from '../types';
import { matchQuoteItemsAI } from '../utils/claudeMatcher';

export const apiService = {
  async generateQuoteItems(
    userInput: string,
    _priceListId: string,
    priceList: PriceListItem[]
  ): Promise<{ items: IdentifiedItem[] }> {
    const apiKey = localStorage.getItem('anthropicApiKey');
    const items = await matchQuoteItemsAI(userInput, priceList, apiKey);
    return { items };
  },
};
