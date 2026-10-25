import { db, resetItems, resetTransactions } from './db.js';

const deletedItems = resetItems();
const deletedTransactions = resetTransactions();
console.log(
  `[reset] ${deletedItems} ürün ve ${deletedTransactions} kasa kaydı silindi. Pano boş.`,
);
db.close();
