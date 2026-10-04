// Single place for business contact details.
// WhatsApp number: set VITE_WHATSAPP_NUMBER (digits with country code, e.g. 91XXXXXXXXXX) once the owner confirms it.
// Until then it stays empty and buttons fall back to Instagram.
const envNumber = (import.meta.env['VITE_WHATSAPP_NUMBER'] as string | undefined) ?? '';
export const storeConfig = {
  name: 'YOUTH FASHION SAMPla',
  instagram: 'https://www.instagram.com/youthfashion_sampla/',
  whatsappNumber: envNumber.replace(/\D/g, ''),
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Beri+Mod+Sampla+Haryana+124501',
  address: 'Beri Mod, Sampla, Haryana – 124501, India',
};
export const productEnquiry = (name: string, price: number) => `Hi Youth Fashion Sampla, I am interested in ${name}. Price: ₹${price.toLocaleString('en-IN')}.`;
