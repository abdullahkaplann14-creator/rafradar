import { db, resetItems } from './db.js';

const deleted = resetItems();
console.log(`[reset] ${deleted} ürün silindi. Pano boş.`);
db.close();
