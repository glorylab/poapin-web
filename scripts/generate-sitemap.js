// Script to generate sitemap with top 2,000,000 POAP holders from Gnosis Chain
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the sitemap files
const sitemapsDir = path.join(__dirname, '../public/sitemaps');
const mainSitemapPath = path.join(sitemapsDir, 'main_sitemap.xml');
const staticSitemapPath = path.join(sitemapsDir, 'static_sitemap.xml');

// Configure the POAP GraphQL API endpoint
const POAP_GRAPHQL_BASE_URL = 'https://public.compass.poap.tech/v1/graphql';

// Function to ensure the sitemaps directory exists
function ensureSitemapsDir() {
  if (!fs.existsSync(sitemapsDir)) {
    fs.mkdirSync(sitemapsDir, { recursive: true });
  }
}

// Function to generate wallet sitemap XML
function generateWalletSitemap(addresses, fileNumber) {
  console.log(`Generating wallet sitemap ${fileNumber} with ${addresses.length} addresses...`);
  
  // XML header
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add URLs for each address
  for (const address of addresses) {
    xml += '  <url>\n';
    xml += `    <loc>https://poap.in/v/${address.address}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += '  </url>\n';
  }
  
  // Close XML
  xml += '</urlset>';
  
  return xml;
}

// Function to generate card sitemap XML
function generateCardSitemap(addresses, fileNumber) {
  console.log(`Generating card sitemap ${fileNumber} with ${addresses.length} addresses...`);
  
  // XML header
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add URLs for each address
  for (const address of addresses) {
    xml += '  <url>\n';
    xml += `    <loc>https://poap.in/card/${address.address}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.6</priority>\n';
    xml += '  </url>\n';
  }
  
  // Close XML
  xml += '</urlset>';
  
  return xml;
}

// Function to generate static sitemap with main pages
function generateStaticSitemap() {
  console.log('Generating static sitemap with main pages...');
  
  // XML header
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add static URLs
  const staticUrls = [
    'https://poap.in/',
    'https://poap.in/v',
    'https://poap.in/card',
    'https://poap.in/sponsors',
    'https://poap.in/contact',
  ];
  
  // Add static URLs
  for (const url of staticUrls) {
    xml += '  <url>\n';
    xml += `    <loc>${url}</loc>\n`;
    xml += '    <changefreq>weekly</changefreq>\n';
    xml += '    <priority>0.8</priority>\n';
    xml += '  </url>\n';
  }
  
  // Close XML
  xml += '</urlset>';
  
  return xml;
}

// Function to save sitemaps
function saveSitemaps(addresses, fileNumber) {
  // Generate and save wallet sitemap
  const walletSitemapPath = path.join(sitemapsDir, `wallet_sitemap_${fileNumber}.xml`);
  const walletSitemap = generateWalletSitemap(addresses, fileNumber);
  fs.writeFileSync(walletSitemapPath, walletSitemap);
  console.log(`Wallet sitemap ${fileNumber} saved to ${walletSitemapPath}`);
  
  // Generate and save card sitemap
  const cardSitemapPath = path.join(sitemapsDir, `card_sitemap_${fileNumber}.xml`);
  const cardSitemap = generateCardSitemap(addresses, fileNumber);
  fs.writeFileSync(cardSitemapPath, cardSitemap);
  console.log(`Card sitemap ${fileNumber} saved to ${cardSitemapPath}`);
  
  return {
    walletSitemapPath,
    cardSitemapPath
  };
}

// Function to generate the main sitemap that references all sitemaps
function generateMainSitemap(sitemapPaths) {
  console.log(`Generating main sitemap with ${sitemapPaths.length} sitemaps and static pages...`);
  
  // XML header
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add static sitemap first
  xml += '  <sitemap>\n';
  xml += '    <loc>https://poap.in/sitemaps/static_sitemap.xml</loc>\n';
  xml += '  </sitemap>\n';
  
  // Add references to each sitemap
  for (const sitemapPath of sitemapPaths) {
    const relativePath = path.basename(sitemapPath);
    xml += '  <sitemap>\n';
    xml += `    <loc>https://poap.in/sitemaps/${relativePath}</loc>\n`;
    xml += '  </sitemap>\n';
  }
  
  // Close XML
  xml += '</sitemapindex>';
  
  return xml;
}

// Function to fetch POAP holders in batches and generate sitemaps
async function fetchAndGenerateSitemaps(totalLimit = 2000000, requestBatchSize = 100) {
  console.log(`Fetching top ${totalLimit} POAP holders from Gnosis Chain...`);
  
  let offset = 0;
  let batchNumber = 1;
  let fileNumber = 1;
  let totalHolders = 0;
  const allSitemapPaths = [];
  
  // Collector for addresses until we reach 10,000
  let collectedAddresses = [];
  let minPoapsOwned = Infinity;
  let maxPoapsOwned = 0;
  
  // Null address to exclude
  const NULL_ADDRESS = '0x0000000000000000000000000000000000000000';
  
  // Ensure the sitemaps directory exists
  ensureSitemapsDir();
  
  // Generate and save the static sitemap first
  const staticSitemap = generateStaticSitemap();
  fs.writeFileSync(staticSitemapPath, staticSitemap);
  console.log(`Static sitemap saved to ${staticSitemapPath}`);
  
  while (totalHolders < totalLimit) {
    // Using the query format provided by the user
    const query = `
      query GetTopCollectors {
        collectors(order_by: {poaps_owned: desc}, limit: ${requestBatchSize}, offset: ${offset}) {
          poaps_owned
          address
        }
      }
    `;
    
    try {
      console.log(`Fetching batch ${batchNumber}, holders offset: ${offset}...`);
      const response = await fetch(POAP_GRAPHQL_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`HTTP error! status: ${response.status}, response: ${errorText}`);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.errors) {
        console.error('GraphQL errors:', result.errors);
        throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
      }
      
      // Extract addresses and POAP counts from the collectors response
      const holders = result.data.collectors;
      
      if (holders.length === 0) {
        // No more holders to fetch
        console.log('No more holders found, stopping fetch.');
        break;
      }
      
      // Get the actual number of holders returned in this batch
      const actualBatchSize = holders.length;
      
      // Filter out the null address
      const filteredHolders = holders.filter(holder => holder.address.toLowerCase() !== NULL_ADDRESS.toLowerCase());
      console.log(`Filtered out ${holders.length - filteredHolders.length} null addresses`);
      
      // Update min and max POAP counts for this batch
      const batchMinPoaps = Math.min(...filteredHolders.map(h => h.poaps_owned));
      const batchMaxPoaps = Math.max(...filteredHolders.map(h => h.poaps_owned));
      minPoapsOwned = Math.min(minPoapsOwned, batchMinPoaps);
      maxPoapsOwned = Math.max(maxPoapsOwned, batchMaxPoaps);
      
      // Log batch results
      console.log(`Fetched ${actualBatchSize} holders, kept ${filteredHolders.length} after filtering in batch ${batchNumber}`);
      console.log(`POAP counts in this batch: ${batchMinPoaps} to ${batchMaxPoaps}`);
      
      // Add to collected addresses
      collectedAddresses = [...collectedAddresses, ...filteredHolders];
      console.log(`Total collected addresses: ${collectedAddresses.length}`);
      
      // If we've collected 10,000 addresses or reached the end, save to files
      if (collectedAddresses.length >= 10000 || totalHolders + actualBatchSize >= totalLimit) {
        const addressesToSave = collectedAddresses.slice(0, 10000);
        const { walletSitemapPath, cardSitemapPath } = saveSitemaps(addressesToSave, fileNumber);
        
        // Add paths to the list for the main sitemap
        allSitemapPaths.push(walletSitemapPath, cardSitemapPath);
        
        // Remove saved addresses from collection
        collectedAddresses = collectedAddresses.slice(10000);
        
        // Log POAP count range for this file
        console.log(`File ${fileNumber} POAP count range: ${minPoapsOwned} to ${maxPoapsOwned}`);
        
        // Reset min/max for next file
        minPoapsOwned = Infinity;
        maxPoapsOwned = 0;
        
        // Increment file number
        fileNumber++;
      }
      
      // Update counters
      totalHolders += actualBatchSize;
      offset += actualBatchSize;
      batchNumber++;
      
      // Add a small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
      if (totalHolders >= totalLimit) {
        console.log(`Reached limit of ${totalLimit} holders, stopping fetch.`);
        break;
      }
    } catch (error) {
      console.error('Error fetching POAP holders:', error);
      // If we have some collected addresses, save what we have
      if (collectedAddresses.length > 0) {
        console.warn(`Saving ${collectedAddresses.length} collected addresses due to error`);
        const { walletSitemapPath, cardSitemapPath } = saveSitemaps(collectedAddresses, fileNumber);
        allSitemapPaths.push(walletSitemapPath, cardSitemapPath);
        break;
      }
      throw error;
    }
  }
  
  // Save any remaining addresses that didn't reach 10,000
  if (collectedAddresses.length > 0) {
    console.log(`Saving remaining ${collectedAddresses.length} addresses...`);
    const { walletSitemapPath, cardSitemapPath } = saveSitemaps(collectedAddresses, fileNumber);
    allSitemapPaths.push(walletSitemapPath, cardSitemapPath);
  }
  
  // Generate and save the main sitemap
  const mainSitemap = generateMainSitemap(allSitemapPaths);
  fs.writeFileSync(mainSitemapPath, mainSitemap);
  console.log(`Main sitemap saved to ${mainSitemapPath}`);
  console.log(`Total holders in all sitemaps: ${totalHolders}`);
  
  return {
    sitemapPaths: allSitemapPaths,
    totalHolders
  };
}

// Main function
async function main() {
  try {
    // Fetch holders and generate sitemaps
    await fetchAndGenerateSitemaps(2000000, 100);
    
    console.log('Sitemap generation completed successfully!');
  } catch (error) {
    console.error('Error generating sitemaps:', error);
    process.exit(1);
  }
}

// Run the script
main();
