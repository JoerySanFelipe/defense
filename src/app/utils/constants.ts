import { Timestamp } from '@angular/fire/firestore';
import { Notifications, NotificationType } from '../models/notifications';

import { v4 as uuidv4 } from 'uuid';
import { TransactionType } from '../models/transaction/transaction_type';
import { TransactionStatus } from '../models/transaction/transaction_status';
import { TrasactionDetails } from '../models/transaction/transaction_details';
// export const generateAddedInventoryNotification = (
//   userID: string,
//   product_item: ProductItems
// ) => {
//   const notifications: Notifications = {
//     id: uuidv4(),
//     userID: userID,
//     variantID: product_item.id,
//     type: NotificationType.ADDED,
//     message: `new stocks for '${product_item.name}' successfully added! `,
//     createdAt: new Date(),
//   };
//   return notifications;
// };

export function generateInvoiceID() {
  const timestamp = Date.now();
  const randomPart = Math.floor(Math.random() * 100000);
  const invoiceID = `${timestamp}${randomPart.toString().padStart(5, '0')}`;
  return invoiceID;
}

export function formatTimestamp(date: Date): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  };
  return date.toLocaleString('en-US', options);
}

export function convertTimestampToDate(timestamp: Timestamp): Date {
  return timestamp.toDate();
}

export function getTransactionStatus(number: number): TransactionStatus {
  switch (number) {
    case 0:
      return TransactionStatus.CANCELLED;
    case 1:
      return TransactionStatus.PENDING;
    case 2:
      return TransactionStatus.ACCEPTED;
    case 3:
      return TransactionStatus.READY_TO_DELIVER;
    case 4:
      return TransactionStatus.READY_TO_PICK_UP;
    case 5:
      return TransactionStatus.OUT_OF_DELIVERY;
    case 6:
      return TransactionStatus.FAILED;
    case 7:
      return TransactionStatus.COMPLETED;
    default:
      return TransactionStatus.PENDING;
  }
}

export function getTransactionType(type: number) {
  switch (type) {
    case 1:
      return TransactionType.DELIVERY;
    case 2:
      return TransactionType.PICK_UP;
    case 3:
      return TransactionType.WALK_IN;
    default:
      return TransactionType.DELIVERY;
  }
}

export function generateTransactionDetails(
  transactionID: string,
  status: TransactionStatus
) {
  var details: TrasactionDetails = {
    updatedBy: 'Agritech Admin',
    message: 'Your order is accepted and ready to pack',
    status: TransactionStatus.ACCEPTED,
    updatedAt: Timestamp.now(),
    seen: false,
    id: generateInvoiceID(),
    transactionID: transactionID,
  };
  switch (status) {
    case TransactionStatus.ACCEPTED:
      return details;
    case TransactionStatus.READY_TO_PICK_UP:
      details.status = TransactionStatus.READY_TO_PICK_UP;
      details.message = 'Your order is ready to pick up';
      return details;
    case TransactionStatus.READY_TO_DELIVER:
      details.status = TransactionStatus.READY_TO_DELIVER;
      details.message = 'Your order is packed and ready to deliver';
      return details;
    case TransactionStatus.OUT_OF_DELIVERY:
      details.status = TransactionStatus.OUT_OF_DELIVERY;
      details.message =
        'Our rider will attempt parcel delivery with the day. Please keep your lines open and prepare exact payment for COD';
      return details;
    case TransactionStatus.COMPLETED:
      details.status = TransactionStatus.COMPLETED;
      details.message = 'Your order has been delivered';
      return details;
    case TransactionStatus.FAILED:
      details.status = TransactionStatus.FAILED;
      details.message = 'order failed';
      return details;
    case TransactionStatus.CANCELLED:
      details.status = TransactionStatus.CANCELLED;
      details.message = 'order was cancelled';
      return details;
    default:
      return details;
  }
}

import { Order, Products } from 'src/app/models/products';
import { Messages } from '../models/messages';
import { Address } from '../models/user_address';
import { CustomerAddress } from '../models/addresses';
import { transition } from '@angular/animations';
import { Transactions } from '../models/transaction/transactions';
import { PaymentStatus } from '../models/transaction/payment';

export function formatPrice(value: number): string {
  return value.toLocaleString('en-us', {
    style: 'currency',
    currency: 'PHP',
  });
}

export function getEffectivePrice(products: Products): string {
  if (products.variations.length === 0) {
    return formatPrice(products.price);
  } else {
    // Calculate the min and max price from variations
    let minPrice = Number.POSITIVE_INFINITY;
    let maxPrice = Number.NEGATIVE_INFINITY;

    for (const variation of products.variations) {
      if (variation.price < minPrice) {
        minPrice = variation.price;
      }
      if (variation.price > maxPrice) {
        maxPrice = variation.price;
      }
    }

    if (minPrice === maxPrice) {
      return formatPrice(minPrice);
    } else {
      return `${formatPrice(minPrice)} - ${formatPrice(maxPrice)}`;
    }
  }
}

export function computeSubTotal(order: Order[]): number {
  let subTotal = 0;
  order.map((e) => {
    subTotal += e.price * e.quantity;
  });
  return subTotal;
}

export function findProductById(
  productList: Products[],
  idToFind: string
): Products | null {
  return productList.find((product) => product.id === idToFind) ?? null;
}
export const months = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function removeDuplicateMessages(messages: Messages[]): Messages[] {
  const uniqueIds = new Set<string>();
  const uniqueMessages: Messages[] = [];

  for (const message of messages) {
    if (!uniqueIds.has(message.id)) {
      uniqueIds.add(message.id);
      uniqueMessages.push(message);
    }
  }
  return uniqueMessages;
}

export function formatTimeDifference(timestamp: Timestamp | null): string {
  if (timestamp === null) {
    return '';
  }
  const now = new Date();
  const dateTime = timestamp.toDate(); // Convert Firestore Timestamp to Date
  const difference = Math.abs(now.getTime() - dateTime.getTime());

  const days = Math.floor(difference / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));

  if (days > 365) {
    const years = Math.floor(days / 365);
    return `${years} ${years === 1 ? 'year' : 'years'} ago`;
  } else if (days >= 30) {
    const months = Math.floor(days / 30);
    return `${months} ${months === 1 ? 'month' : 'months'} ago`;
  } else if (days >= 7) {
    const weeks = Math.floor(days / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else if (days > 0) {
    return `${days} ${days === 1 ? 'day' : 'days'} ago`;
  } else if (hours > 0) {
    return `${hours} ${hours === 1 ? 'hour' : 'hours'} ago`;
  } else if (minutes > 0) {
    return `${minutes} ${minutes === 1 ? 'min' : 'mins'} ago`;
  } else {
    return 'just now';
  }
}

export function getFormattedLocation(address: CustomerAddress) {
  return `${address.barangay}, ${address.city}, ${address.province}, ${address.region} |  ${address.postalCode}`;
}

export function getDefaultAddress(
  userAddresses: CustomerAddress[]
): CustomerAddress | null {
  const defaultAddress = userAddresses.find((address) => {
    address.isDefault;
  });

  return defaultAddress ?? null;
}

export function startOfDay(date: Date): Date {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function endOfDay(date: Date): Date {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return end;
}

export const toPHP = (num: number): string => {
  // Convert the number to a string and add commas for thousands separator
  const formattedNum = num.toLocaleString('en-US', {
    style: 'currency',
    currency: 'PHP',
  });

  return formattedNum;
};

export async function getImageDataUrl(imagePath: string): Promise<string> {
  const response = await fetch(imagePath);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export function computeAllTransactionAmount(
  transition: Transactions[]
): string {
  let total = 0;
  transition.forEach((t) => {
    total += t.payment?.amount;
  });

  return toPHP(total);
}

export function computeByPaymentStatus(
  transaction: Transactions[],
  status: PaymentStatus
) {
  let total = 0;
  transaction.forEach((t) => {
    if (t.payment.status === status) {
      total += t.payment?.amount;
    }
  });

  return toPHP(total);
}

export const companyInfo = {
  logo: 'src/assets/images/logo.png',
  name: 'S&P Enterprises Inc.',
  address: 'Brgy. Nancayasan, Urdaneta City, Pangasinan',
  email: 'sales@spei.com.ph',
  telephone: '075 568 2705',
};
