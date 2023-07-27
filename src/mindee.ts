import * as mindee from "mindee";

// Init a new client
const mindeeClient = new mindee.Client({ apiKey: process.env.MINDEE_API_KEY! });

export async function getReceiptData(url: string) {
  const apiResponse = mindeeClient
    .docFromUrl(url)
    .parse(mindee.ReceiptV5);

  return (await apiResponse).document;
}

export function receiptToCSV(receipt: mindee.ReceiptV5) {
  const header = ['description,quantity,unitPrice,totalAmount,date,supermarket']; 
  const supplierName = receipt.supplierName ?? 'unknown';
  const date = (receipt.date?.dateObject)?.toISOString() ?? 'unknown';

  const lines = receipt.lineItems.map(line => {
    const quantity = line.quantity ?? 1;
    const unitPrice = line.unitPrice ?? line.totalAmount! / quantity;
    const totalAmount = line.totalAmount ?? line.unitPrice! * quantity;
    

    return `${line.description},${quantity},${unitPrice},${totalAmount},${date},${supplierName}`;
  });

  return header.concat(lines).join('\n');
}