import * as yup from 'yup';
import './extension';

export const ProductBaseSchema = yup.object({
  sku: yup.string().default(''),
  profit: yup.number().default(0),
  supplierPrice: yup.number().default(0),
  sellingPrice: yup.number().required(),
  discountedPrice: yup.number().default(0),
  discountPercentage: yup.number().default(0),
  stockQuantity: yup.number().default(0),
  soldQuantity: yup.number().default(0),
  transport: yup.object({
    weight: yup.number().required(),
    width: yup.number().required(),
    height: yup.number().required(),
    length: yup.number().required(),
    shippingPrice: yup.number().required(),
  }),
});

export const ProductVariantSchema = ProductBaseSchema.shape({
  _id: yup.string().objectId(),
  options: yup
    .array(
      yup.object({
        name: yup.string().required(),
        value: yup.string().required(),
      }),
    )
    .required()
    .min(1),
  thumbnail: yup.string().trim().required(),
});
