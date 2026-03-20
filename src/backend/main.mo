import Text "mo:core/Text";
import Nat "mo:core/Nat";
import Time "mo:core/Time";
import List "mo:core/List";
import Order "mo:core/Order";
import Array "mo:core/Array";
import Map "mo:core/Map";

import Runtime "mo:core/Runtime";


actor {
  public type Product = {
    id : Nat;
    name : Text;
    price : Nat;
    barcode : Text;
    stock : Nat;
  };

  public type Customer = {
    id : Nat;
    name : Text;
    phone : Text;
    email : Text;
  };

  public type PaymentType = {
    id : Nat;
    name : Text;
  };

  public type SaleItem = {
    productId : Nat;
    quantity : Nat;
    unitPrice : Nat;
  };

  public type Sale = {
    id : Nat;
    customerId : Nat;
    paymentTypeId : Nat;
    date : Time.Time;
    items : [SaleItem];
    totalAmount : Nat;
  };

  module Product {
    public func compare(p1 : Product, p2 : Product) : Order.Order {
      Nat.compare(p1.id, p2.id);
    };
  };

  module Customer {
    public func compare(c1 : Customer, c2 : Customer) : Order.Order {
      Nat.compare(c1.id, c2.id);
    };
  };

  module PaymentType {
    public func compare(pt1 : PaymentType, pt2 : PaymentType) : Order.Order {
      Nat.compare(pt1.id, pt2.id);
    };
  };

  module Sale {
    public func compare(s1 : Sale, s2 : Sale) : Order.Order {
      Nat.compare(s1.id, s2.id);
    };
  };

  var nextProductId = 1;
  var nextCustomerId = 1;
  var nextPaymentTypeId = 1;
  var nextSaleId = 1;

  let products = Map.empty<Nat, Product>();
  let customers = Map.empty<Nat, Customer>();
  let paymentTypes = Map.empty<Nat, PaymentType>();
  let sales = Map.empty<Nat, Sale>();

  public shared ({ caller }) func seed() : async () {
    shouldMapBeEmpty(products, "Products");
    shouldMapBeEmpty(customers, "Customers");
    shouldMapBeEmpty(paymentTypes, "Payment Types");
    shouldMapBeEmpty(sales, "Sales");

    // Products
    addProduct("Apple", 100, "123456789", 50);
    addProduct("Banana", 50, "987654321", 30);
    addProduct("Milk", 200, "111222333", 20);
    addProduct("Bread", 150, "444555666", 15);
    addProduct("Eggs", 250, "777888999", 10);

    // Customers
    addCustomer("John Doe", "123-456-7890", "john@example.com");
    addCustomer("Jane Smith", "987-654-3210", "jane@example.com");
    addCustomer("Bob Johnson", "555-555-5555", "bob@example.com");

    // Payment Types
    addPaymentType("Cash");
    addPaymentType("Card");
    addPaymentType("Transfer");

    // Sales
    let sale1Items = List.empty<SaleItem>();
    sale1Items.add({
      productId = 1;
      quantity = 2;
      unitPrice = 100;
    });
    sale1Items.add({
      productId = 2;
      quantity = 3;
      unitPrice = 50;
    });

    addSale(1, 1, 1, sale1Items.toArray(), 350);

    let sale2Items = List.empty<SaleItem>();
    sale2Items.add({
      productId = 3;
      quantity = 1;
      unitPrice = 200;
    });
    sale2Items.add({
      productId = 4;
      quantity = 2;
      unitPrice = 150;
    });

    addSale(2, 2, 2, sale2Items.toArray(), 500);
  };

  func addProduct(name : Text, price : Nat, barcode : Text, stock : Nat) {
    let product : Product = {
      id = nextProductId;
      name;
      price;
      barcode;
      stock;
    };
    products.add(nextProductId, product);
    nextProductId += 1;
  };

  func addCustomer(name : Text, phone : Text, email : Text) {
    let customer : Customer = {
      id = nextCustomerId;
      name;
      phone;
      email;
    };
    customers.add(nextCustomerId, customer);
    nextCustomerId += 1;
  };

  func addPaymentType(name : Text) {
    let paymentType : PaymentType = {
      id = nextPaymentTypeId;
      name;
    };
    paymentTypes.add(nextPaymentTypeId, paymentType);
    nextPaymentTypeId += 1;
  };

  func addSale(customerId : Nat, paymentTypeId : Nat, date : Time.Time, items : [SaleItem], totalAmount : Nat) {
    let sale : Sale = {
      id = nextSaleId;
      customerId;
      paymentTypeId;
      date;
      items;
      totalAmount;
    };
    sales.add(nextSaleId, sale);
    nextSaleId += 1;
  };

  func shouldMapBeEmpty<K, V>(map : Map.Map<K, V>, name : Text) {
    if (map.size() > 0) {
      Runtime.trap(name # " must be empty");
    };
  };

  // Product CRUD
  public shared ({ caller }) func createProduct(name : Text, price : Nat, barcode : Text, stock : Nat) : async Nat {
    let product : Product = {
      id = nextProductId;
      name;
      price;
      barcode;
      stock;
    };
    products.add(nextProductId, product);
    nextProductId += 1;
    product.id;
  };

  public query ({ caller }) func getProduct(id : Nat) : async Product {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?product) { product };
    };
  };

  public query ({ caller }) func getAllProducts() : async [Product] {
    products.values().toArray().sort();
  };

  public shared ({ caller }) func updateProduct(id : Nat, name : Text, price : Nat, barcode : Text, stock : Nat) : async () {
    switch (products.get(id)) {
      case (null) { Runtime.trap("Product not found") };
      case (?_) {
        let product : Product = {
          id;
          name;
          price;
          barcode;
          stock;
        };
        products.add(id, product);
      };
    };
  };

  public shared ({ caller }) func deleteProduct(id : Nat) : async () {
    if (not products.containsKey(id)) {
      Runtime.trap("Product not found");
    };
    products.remove(id);
  };

  // Customer CRUD
  public shared ({ caller }) func createCustomer(name : Text, phone : Text, email : Text) : async Nat {
    let customer : Customer = {
      id = nextCustomerId;
      name;
      phone;
      email;
    };
    customers.add(nextCustomerId, customer);
    nextCustomerId += 1;
    customer.id;
  };

  public query ({ caller }) func getCustomer(id : Nat) : async Customer {
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?customer) { customer };
    };
  };

  public query ({ caller }) func getAllCustomers() : async [Customer] {
    customers.values().toArray().sort();
  };

  public shared ({ caller }) func updateCustomer(id : Nat, name : Text, phone : Text, email : Text) : async () {
    switch (customers.get(id)) {
      case (null) { Runtime.trap("Customer not found") };
      case (?_) {
        let customer : Customer = {
          id;
          name;
          phone;
          email;
        };
        customers.add(id, customer);
      };
    };
  };

  public shared ({ caller }) func deleteCustomer(id : Nat) : async () {
    if (not customers.containsKey(id)) {
      Runtime.trap("Customer not found");
    };
    customers.remove(id);
  };

  // Payment Type CRUD
  public shared ({ caller }) func createPaymentType(name : Text) : async Nat {
    let paymentType : PaymentType = {
      id = nextPaymentTypeId;
      name;
    };
    paymentTypes.add(nextPaymentTypeId, paymentType);
    nextPaymentTypeId += 1;
    paymentType.id;
  };

  public query ({ caller }) func getPaymentType(id : Nat) : async PaymentType {
    switch (paymentTypes.get(id)) {
      case (null) { Runtime.trap("Payment type not found") };
      case (?paymentType) { paymentType };
    };
  };

  public query ({ caller }) func getAllPaymentTypes() : async [PaymentType] {
    paymentTypes.values().toArray().sort();
  };

  public shared ({ caller }) func updatePaymentType(id : Nat, name : Text) : async () {
    switch (paymentTypes.get(id)) {
      case (null) { Runtime.trap("Payment type not found") };
      case (?_) {
        let paymentType : PaymentType = {
          id;
          name;
        };
        paymentTypes.add(id, paymentType);
      };
    };
  };

  public shared ({ caller }) func deletePaymentType(id : Nat) : async () {
    if (not paymentTypes.containsKey(id)) {
      Runtime.trap("Payment type not found");
    };
    paymentTypes.remove(id);
  };

  func updateProductStock(productId : Nat, quantity : Nat) {
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product with id " # productId.toText() # " not found") };
      case (?product) {
        if (quantity > product.stock) { Runtime.trap("Insufficient stock for product " # product.name) };
        let updatedProduct = {
          product with
          stock = product.stock - quantity;
        };
        products.add(productId, updatedProduct);
      };
    };
  };

  func restoreProductStock(productId : Nat, quantity : Nat) {
    switch (products.get(productId)) {
      case (null) { Runtime.trap("Product with id " # productId.toText() # " not found") };
      case (?product) {
        let updatedProduct = {
          product with
          stock = product.stock + quantity;
        };
        products.add(productId, updatedProduct);
      };
    };
  };

  // Sales
  public shared ({ caller }) func createSale(customerId : Nat, paymentTypeId : Nat, items : [SaleItem]) : async Nat {
    // Update product stocks and validate quantities
    for (item in items.values()) {
      updateProductStock(item.productId, item.quantity);
    };

    let totalAmount = items.foldLeft(0, func(acc, item) { acc + (item.quantity * item.unitPrice) });

    let sale : Sale = {
      id = nextSaleId;
      customerId;
      paymentTypeId;
      date = Time.now();
      items;
      totalAmount;
    };
    sales.add(nextSaleId, sale);
    nextSaleId += 1;
    sale.id;
  };

  public shared ({ caller }) func deleteSale(saleId : Nat) : async () {
    switch (sales.get(saleId)) {
      case (null) {
        Runtime.trap("Sale not found");
      };
      case (?sale) {
        // Restore product stock for each item
        for (item in sale.items.values()) {
          restoreProductStock(item.productId, item.quantity);
        };
        sales.remove(saleId);
      };
    };
  };

  public query ({ caller }) func getSale(id : Nat) : async Sale {
    switch (sales.get(id)) {
      case (null) { Runtime.trap("Sale not found") };
      case (?sale) { sale };
    };
  };

  public query ({ caller }) func getAllSales() : async [Sale] {
    sales.values().toArray().sort();
  };
};
