import { z } from 'zod';

export const posItemSchema = z.object({
  categoryId: z.string().min(1, 'Chọn loại dịch vụ'),
  serviceId: z.string().min(1, 'Chọn chi tiết dịch vụ'),
  sessions: z.coerce.number().int().min(1, 'Tối thiểu 1 buổi'),
  unitPrice: z.coerce.number().min(0, 'Đơn giá không hợp lệ'),
});

export const posFormSchema = z.object({
  orderDate: z.string().min(1),
  customerPhone: z.string().min(6, 'Nhập SĐT hợp lệ'),
  customerName: z.string().min(1, 'Nhập tên khách'),
  salesChannelId: z.union([z.string().min(1), z.literal('')]),
  items: z.array(posItemSchema).min(1, 'Cần ít nhất một dịch vụ'),
  discountType: z.enum(['VND', 'PERCENT']),
  discountValue: z.coerce.number().min(0),
  amountReceived: z.coerce.number().min(0),
  notes: z.string().optional(),
});

export type PosFormValues = z.infer<typeof posFormSchema>;
