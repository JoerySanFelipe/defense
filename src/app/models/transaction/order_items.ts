import { Order } from '../products';
import { ShippingInfo } from '../shipping';

export interface OrderItems {
  productID: string;
  productName: string;
  isVariation: boolean;
  variationID: string;
  quantity: number;
  cost: number;
  price: number;
  imageUrl: string;
  shippingInfo: ShippingInfo;
}

export const ordersToOrderItems = (order: Order[]): OrderItems[] => {
  let orderList: OrderItems[] = [];
  order.map((order) => {
    orderList.push({
      productID: order.productID,
      productName: order.name,
      isVariation: order.isVariation,
      variationID: order.variatioID,
      quantity: order.quantity,
      cost: order.cost,
      price: order.price,
      imageUrl: order.image,
      shippingInfo: order.shippingInfo,
    });
  });
  return orderList;
};
