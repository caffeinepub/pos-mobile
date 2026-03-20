import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface PaymentType {
    id: bigint;
    name: string;
}
export type Time = bigint;
export interface Sale {
    id: bigint;
    date: Time;
    paymentTypeId: bigint;
    totalAmount: bigint;
    customerId: bigint;
    items: Array<SaleItem>;
}
export interface Customer {
    id: bigint;
    name: string;
    email: string;
    phone: string;
}
export interface SaleItem {
    productId: bigint;
    quantity: bigint;
    unitPrice: bigint;
}
export interface Product {
    id: bigint;
    name: string;
    stock: bigint;
    barcode: string;
    price: bigint;
}
export interface backendInterface {
    createCustomer(name: string, phone: string, email: string): Promise<bigint>;
    createPaymentType(name: string): Promise<bigint>;
    createProduct(name: string, price: bigint, barcode: string, stock: bigint): Promise<bigint>;
    createSale(customerId: bigint, paymentTypeId: bigint, items: Array<SaleItem>): Promise<bigint>;
    deleteCustomer(id: bigint): Promise<void>;
    deletePaymentType(id: bigint): Promise<void>;
    deleteProduct(id: bigint): Promise<void>;
    deleteSale(saleId: bigint): Promise<void>;
    getAllCustomers(): Promise<Array<Customer>>;
    getAllPaymentTypes(): Promise<Array<PaymentType>>;
    getAllProducts(): Promise<Array<Product>>;
    getAllSales(): Promise<Array<Sale>>;
    getCustomer(id: bigint): Promise<Customer>;
    getPaymentType(id: bigint): Promise<PaymentType>;
    getProduct(id: bigint): Promise<Product>;
    getSale(id: bigint): Promise<Sale>;
    seed(): Promise<void>;
    updateCustomer(id: bigint, name: string, phone: string, email: string): Promise<void>;
    updatePaymentType(id: bigint, name: string): Promise<void>;
    updateProduct(id: bigint, name: string, price: bigint, barcode: string, stock: bigint): Promise<void>;
}
