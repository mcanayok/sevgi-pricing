// Database operations for price scraping

/**
 * Save price to history and update product_url
 */
async function savePriceData(supabase, productUrl, { originalPrice, discountPrice, memberPrice, error }) {
  // Insert into price history
  const { error: insertError } = await supabase.from("price_history").insert({
    product_url_id: productUrl.id,
    original_price: originalPrice || null,
    discount_price: discountPrice || null,
    member_price: memberPrice || null,
    price: originalPrice || null, // Backwards compatibility
    error: error || null,
    scraped_at: new Date().toISOString(),
  });

  if (insertError) {
    console.log(`⚠️ Error saving to history: ${insertError.message}`);
  }

  // Update product_url with latest prices (only if we got a price)
  if (originalPrice !== null) {
    await supabase
      .from("product_urls")
      .update({
        original_price: originalPrice,
        discount_price: discountPrice,
        member_price: memberPrice,
        last_price: originalPrice, // Backwards compatibility
        last_scraped_at: new Date().toISOString(),
      })
      .eq("id", productUrl.id);
  }
}

module.exports = {
  savePriceData
};
