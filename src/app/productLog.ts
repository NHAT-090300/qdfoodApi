import ExcelJS from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { EInventoryTransactionType, IProductLogFilter } from 'interface';
import { AppError, Inventory, InventoryTransaction, ProductLog } from 'model';
import { ObjectId } from 'mongodb';

import BaseApp from './base';

const where = 'App.productLog';

export class ProductLogApp extends BaseApp {
  async create(data: ProductLog & { userName: string }) {
    try {
      const result = await this.getStore().productLog().createOne(new ProductLog(data));

      const inventoryApp = this.getStore().inventory();
      const inventoryAppTransaction = this.getStore().inventoryTransaction();

      // Update inventory for input ingredients
      for (const item of data.ingredientItem) {
        const productId = new ObjectId(item.productId);

        const inventoryItem = await inventoryApp.findOne(
          { productId },
          {
            _id: 1,
            quantity: 1,
          },
        );

        if (inventoryItem?._id) {
          // Subtract used quantity from inventory
          const existingQty = Number(inventoryItem.quantity) || 0;
          const newQty = existingQty - item.quantity;

          if (newQty < 0) {
            throw new AppError({
              id: `${where}.create`,
              message: `Không đủ hàng tồn kho cho sản phẩm ${item.productId}`,
              statusCode: StatusCodes.BAD_REQUEST,
            });
          }

          const newInventory = new Inventory({
            productId,
            quantity: newQty,
          });
          newInventory.preUpdate();
          await inventoryApp.updateOne(inventoryItem._id?.toString(), newInventory);

          const newInventoryTx = new InventoryTransaction({
            productId,
            type: EInventoryTransactionType?.PRODUC_EXPORT,
            quantity: item.quantity,
            note: `Admin ${data?.userName || data?.userId} đã xuất nguyên liệu để sơ chế`,
            price: 0,
            productLogId: result?._id,
          });
          newInventoryTx.preSave();
          await inventoryAppTransaction.createOne(newInventoryTx);
        } else {
          throw new AppError({
            id: `${where}.create`,
            message: `Không tìm thấy hàng tồn kho cho sản phẩm ${item.productId}`,
            statusCode: StatusCodes.BAD_REQUEST,
          });
        }
      }

      // Update inventory for output products
      for (const item of data.outputItem) {
        const productId = new ObjectId(item.productId);
        const inventoryItem = await inventoryApp.findOne(
          { productId },
          {
            _id: 1,
            quantity: 1,
          },
        );

        if (inventoryItem?._id) {
          // Update existing inventory
          const existingQty = Number(inventoryItem.quantity) || 0;

          // Calculate total quantity
          const totalQty = existingQty + item.quantity;

          const newInventory = new Inventory({
            productId,
            quantity: totalQty,
          });
          newInventory.preUpdate();
          await inventoryApp.updateOne(inventoryItem._id?.toString(), newInventory);
        } else {
          // Create new inventory record
          const newInventory = new Inventory({
            productId: item.productId,
            quantity: item.quantity,
          });
          newInventory.preSave();

          await inventoryApp.createOne(newInventory);
        }

        const newInventoryTx = new InventoryTransaction({
          productId,
          type: EInventoryTransactionType?.PRODUC_IMPORT,
          quantity: item.quantity,
          note: `Admin ${data?.userName || data?.userId} đã nhập thành phẩm sau khi sơ chế`,
          price: 0,
          productLogId: result?._id,
        });
        newInventoryTx.preSave();
        await inventoryAppTransaction.createOne(newInventoryTx);
      }

      return result;
    } catch (error: any) {
      console.log(error);
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo productLog thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getPaginate(filters: IProductLogFilter) {
    try {
      const result = await this.getStore().productLog().getPaginate(filters);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productLog thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(productLogId: string) {
    try {
      const data = await this.getStore().productLog().findById(productLogId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'ProductLog không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu productLog không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportProductLogToExcel(filters: IProductLogFilter) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Tồn kho');

    // Header row
    worksheet.addRow([
      'Mã sản phẩm',
      'Tên sản phẩm',
      'Số lượng',
      'Giá sản phẩm',
      'Số lượng hoàn trả',
    ]);

    // Format header
    worksheet.getRow(1).eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    const productLog = await this.getStore().productLog().getList(filters);

    // Add productLog rows
    productLog?.forEach((item: any) => {
      const product = item.product || {};
      const code = product.code ?? '---';
      const name = product.name ?? 'Không có tên';
      const quantity = item.quantity ?? 0;
      const price = item.price ?? 0;
      const returnQty = item.refundAmount ?? 0;

      const row = [code, name, quantity, price, returnQty];

      const rowRef = worksheet.addRow(row);
      rowRef.eachCell((cell) => {
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    worksheet.columns.forEach((column) => {
      column.width = 20;
    });

    return workbook;
  }
}
