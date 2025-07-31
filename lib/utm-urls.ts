/**
 * UTM URL Generator for SilentParcel
 * Generate UTM URLs for different platforms
 */

export function generateUTMUrl(
  baseUrl: string,
  source: string,
  medium: string = 'social',
  campaign: string = 'privacy_tools',
  content?: string,
  term?: string
): string {
  const params = new URLSearchParams();
  
  params.set('utm_source', source);
  params.set('utm_medium', medium);
  params.set('utm_campaign', campaign);
  
  if (content) params.set('utm_content', content);
  if (term) params.set('utm_term', term);
  
  return `${baseUrl}?${params.toString()}`;
}

// Pre-generated URLs for common platforms
export const UTM_URLS = {
  // https://silentparcel.com/?utm_source=peerlist&utm_medium=social&utm_campaign=product_launch&utm_content=product_showcase
  peerlist: (baseUrl: string = 'https://silentparcel.com/') => 
    generateUTMUrl(baseUrl, 'peerlist', 'social', 'product_launch', 'product_showcase'),

// https://silentparcel.com/?utm_source=wp&utm_medium=social&utm_campaign=sharing&utm_content=product_sharing
  wp: (baseUrl: string = 'https://silentparcel.com/') => 
    generateUTMUrl(baseUrl, 'wp', 'social', 'sharing', 'product_sharing'),
  
  // https://silentparcel.com/?utm_source=producthunt&utm_medium=social&utm_campaign=product_launch&utm_content=product_page  
  producthunt: (baseUrl: string = 'https://silentparcel.com/') => 
    generateUTMUrl(baseUrl, 'producthunt', 'social', 'product_launch', 'product_page'),
  
  // https://silentparcel.com/?utm_source=x&utm_medium=social&utm_campaign=privacy_awareness&utm_content=tweet
  x: (baseUrl: string = 'https://silentparcel.com/') => 
    generateUTMUrl(baseUrl, 'x', 'social', 'privacy_awareness', 'tweet'),
  
  // https://silentparcel.com/?utm_source=reddit&utm_medium=social&utm_campaign=community_engagement&utm_content=reddit_post
  reddit: (baseUrl: string = 'https://silentparcel.com/') => 
    generateUTMUrl(baseUrl, 'reddit', 'social', 'community_engagement', 'reddit_post'),
  
  // https://silentparcel.com/?utm_source=discord&utm_medium=social&utm_campaign=community_building&utm_content=discord_message
  discord: (baseUrl: string = 'https://silentparcel.com/') => 
    generateUTMUrl(baseUrl, 'discord', 'social', 'community_building', 'discord_message'),
  
  // https://silentparcel.com/?utm_source=linkedin&utm_medium=social&utm_campaign=professional_networking&utm_content=linkedin_post
  linkedin: (baseUrl: string = 'https://silentparcel.com/') => 
    generateUTMUrl(baseUrl, 'linkedin', 'social', 'professional_networking', 'linkedin_post'),
  
  // https://silentparcel.com/?utm_source=medium&utm_medium=content&utm_campaign=thought_leadership&utm_content=blog_post
  medium: (baseUrl: string = 'https://silentparcel.com/') => 
    generateUTMUrl(baseUrl, 'medium', 'content', 'thought_leadership', 'blog_post'),
}; 