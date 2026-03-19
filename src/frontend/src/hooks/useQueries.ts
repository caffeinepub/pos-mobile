import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { SaleItem } from "../backend.d";
import { useActor } from "./useActor";

export function useProducts() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllProducts();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCustomers() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["customers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllCustomers();
    },
    enabled: !!actor && !isFetching,
  });
}

export function usePaymentTypes() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["paymentTypes"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPaymentTypes();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSales() {
  const { actor, isFetching } = useActor();
  return useQuery({
    queryKey: ["sales"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllSales();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePaymentType() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.createPaymentType(name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paymentTypes"] }),
  });
}

export function useUpdatePaymentType() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, name }: { id: bigint; name: string }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.updatePaymentType(id, name);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paymentTypes"] }),
  });
}

export function useDeletePaymentType() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deletePaymentType(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["paymentTypes"] }),
  });
}

export function useCreateSale() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      customerId,
      paymentTypeId,
      items,
    }: {
      customerId: bigint;
      paymentTypeId: bigint;
      items: SaleItem[];
    }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.createSale(customerId, paymentTypeId, items);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sales"] }),
  });
}

export function useCreateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      price,
      barcode,
      stock,
    }: {
      name: string;
      price: bigint;
      barcode: string;
      stock: bigint;
    }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.createProduct(name, price, barcode, stock);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useUpdateProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      price,
      barcode,
      stock,
    }: {
      id: bigint;
      name: string;
      price: bigint;
      barcode: string;
      stock: bigint;
    }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.updateProduct(id, name, price, barcode, stock);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useDeleteProduct() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deleteProduct(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products"] }),
  });
}

export function useSeed() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.seed();
    },
    onSuccess: () =>
      qc.invalidateQueries({
        predicate: () => true,
      }),
  });
}

export function useCreateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      name,
      phone,
      email,
    }: { name: string; phone: string; email: string }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.createCustomer(name, phone, email);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useUpdateCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      name,
      phone,
      email,
    }: { id: bigint; name: string; phone: string; email: string }) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.updateCustomer(id, name, phone, email);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}

export function useDeleteCustomer() {
  const { actor } = useActor();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: bigint) => {
      if (!actor) throw new Error("Actor no disponible");
      return actor.deleteCustomer(id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["customers"] }),
  });
}
