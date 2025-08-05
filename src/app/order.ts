/* eslint-disable new-cap */
import ExcelJS from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { findOrderWithStatus, formatCurrency, getOrderAddress } from 'utils';
// eslint-disable-next-line import/no-extraneous-dependencies
import { jsPDF } from 'jspdf';
// eslint-disable-next-line import/no-extraneous-dependencies
import autoTable from 'jspdf-autotable';

import { EInventoryTransactionType, EOrderStatus, IOrderFilter, IOrderItem } from 'interface';
import { AppError, InventoryTransaction, Order } from 'model';
import { ObjectId } from 'mongodb';
import BaseApp from './base';

const where = 'App.order';

export class OrderApp extends BaseApp {
  async getCountByStatuses(filters: IOrderFilter) {
    try {
      return await this.getStore().order().getCountByStatuses(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getCountByStatuses`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getPaginate(filters: IOrderFilter, project: object = {}) {
    try {
      const result = await this.getStore().order().getPaginate(filters, project);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getStockOrderPaginate(filters: IOrderFilter) {
    try {
      const result = await this.getStore().order().getStockOrderPaginate(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getStockOrderPaginate`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getUserDebt(filters: IOrderFilter) {
    try {
      const result = await this.getStore().order().getUserDebt(filters);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getStockOrderPaginate`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getStockOrderList(filters: IOrderFilter) {
    try {
      return await this.getStore().order().getStockOrderList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getStockOrderList`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IOrderFilter) {
    try {
      return await this.getStore().order().getList(filters);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(orderId: string) {
    try {
      const data = await this.getStore().order().getOne(orderId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'Order không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu order không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getOrderWithInventoryInfo(orderId: string) {
    const result = [];

    const order = await this.getStore().order().getOne(orderId);
    if (!order) {
      throw new AppError({
        id: `${where}.getById`,
        message: 'Order không có hoặc chưa tồn tại',
        statusCode: StatusCodes.NOT_FOUND,
      });
    }

    for (let i = 0; i < order?.items?.length; i++) {
      const item = order?.items[i];
      const inventory = await this.getStore()
        .inventory()
        .findOne({ productId: new ObjectId(item.productId) });
      const inventoryQuantity = inventory?.quantity ?? 0;
      const missingQuantity = Math.max(0, item.quantity - inventoryQuantity);

      result.push({
        ...item,
        inventoryQuantity,
        missingQuantity,
      });
    }

    return {
      ...order,
      items: result,
    };
  }

  async create(data: Order) {
    try {
      const result = await this.getStore().order().createOne(data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(orderId: string, data: Order) {
    try {
      const result = await this.getStore().order().updateOne(orderId, data);

      return result;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(orderId: string) {
    try {
      await this.getStore()
        .order()
        .baseDelete({ _id: new ObjectId(orderId) });
    } catch (error: any) {
      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async updateStatus(
    orderId: string,
    data: {
      status: EOrderStatus;
      reason?: string;
      paymentVerifierId?: string;
      unpaidAmount?: number;
    },
  ) {
    try {
      const order = await this.getStore().order().findById(orderId);

      if (!order) {
        throw new AppError({
          id: `${where}.string`,
          message: 'Dữ liệu không tồn tại trong hệ thống',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      if (data?.status === EOrderStatus.SHIPPING) {
        await this.getStore().inventory().updateInventoryFromOrder(order);

        for (const item of order.items) {
          const transaction = new InventoryTransaction({
            productId: item.productId,
            type: EInventoryTransactionType.EXPORT,
            quantity: item.quantity,
            orderId: order._id,
            warehousePrice: item.price,
            refundPrice: item.refundAmount,
            note: `Xuất kho tạo khi đơn hàng ${order._id?.toString()}`,
          });

          await this.getStore().inventoryTransaction().createOne(transaction);
        }
      }

      const updateData: any = {
        ...data,
        ...(data.paymentVerifierId && {
          paymentVerifierId: new ObjectId(data.paymentVerifierId),
        }),
        ...(data.unpaidAmount && {
          unpaidAmount: Number(data?.unpaidAmount),
        }),
      };

      await this.getStore()
        .order()
        .baseUpdate({ _id: new ObjectId(orderId) }, { $set: updateData });
    } catch (error: any) {
      throw new AppError({
        id: `${where}.updateStatus`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportOrders(filters: IOrderFilter) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('orders');

      // Title
      worksheet.mergeCells('A1:L1');
      worksheet.getCell('A1').value = 'THỐNG KÊ ĐƠN HÀNG';
      worksheet.getCell('A1').font = { bold: true, size: 16 };
      worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

      worksheet.mergeCells('A2:L2');
      worksheet.getCell('A2').value = 'CÔNG TY TNHH THỰC PHẨM QUẢNG ĐÀ';
      worksheet.getCell('A2').font = { italic: true, size: 12 };
      worksheet.getCell('A2').alignment = { horizontal: 'center' };

      worksheet.mergeCells('A3:L3');
      worksheet.getCell('A3').value = `Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`;
      worksheet.getCell('A3').alignment = { horizontal: 'center' };

      // Header row (row 4)
      const headerRow = worksheet.addRow([
        'Mã Đơn Hàng',
        'Tên Khách Hàng',
        'Email',
        'Số điện thoại',
        'Địa chỉ',
        'Mã Sản Phẩm',
        'Tên Sản Phẩm',
        'Số Lượng',
        'Giá bán',
        'Thành tiền',
        'Tổng Tiền',
        'Trạng Thái',
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { bold: true, size: 12 };
        cell.alignment = { vertical: 'middle', horizontal: 'center' };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      const orders = await this.getStore().order().getList(filters);

      orders.forEach((order) => {
        const address = getOrderAddress(order.shippingAddress);
        const statusLabel = findOrderWithStatus(order.status)?.label || order.status;
        const customerName = order.user?.name || '';
        const customerEmail = order.user?.email || '';
        const customerPhone = order.user?.phoneNumber || '';
        const totalOrderAmount = formatCurrency(order.total || 0);

        if (Array.isArray(order.items)) {
          order.items.forEach((item) => {
            const row = [
              order._id?.toString(),
              customerName,
              customerEmail,
              customerPhone,
              address,
              item.code || '---',
              item.name || '',
              item.quantity,
              formatCurrency(Number(item.price)),
              formatCurrency(Number(item.price * item.quantity)),
              totalOrderAmount,
              statusLabel,
            ];

            const rowRef = worksheet.addRow(row);

            rowRef.eachCell((cell) => {
              cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' },
              };
            });
          });
        } else {
          console.warn('order.items không phải là array:', order.items);
        }
      });

      // Tính lại dòng cuối cùng sau khi add toàn bộ dữ liệu
      const lastRowNumber = worksheet.lastRow?.number || 0;

      worksheet.addRow([]); // Dòng trống
      worksheet.mergeCells(`A${lastRowNumber + 2}:C${lastRowNumber + 2}`);
      worksheet.getCell(`A${lastRowNumber + 2}`).value = 'Người giao hàng';
      worksheet.getCell(`A${lastRowNumber + 2}`).alignment = { horizontal: 'center' };

      worksheet.mergeCells(`J${lastRowNumber + 2}:L${lastRowNumber + 2}`);
      worksheet.getCell(`J${lastRowNumber + 2}`).value = 'Người nhận hàng';
      worksheet.getCell(`J${lastRowNumber + 2}`).alignment = { horizontal: 'center' };

      worksheet.mergeCells(`A${lastRowNumber + 3}:C${lastRowNumber + 3}`);
      worksheet.getCell(`A${lastRowNumber + 3}`).value = '(ký, và ghi rõ họ tên)';
      worksheet.getCell(`A${lastRowNumber + 3}`).font = { italic: true };
      worksheet.getCell(`A${lastRowNumber + 3}`).alignment = { horizontal: 'center' };

      worksheet.mergeCells(`J${lastRowNumber + 3}:L${lastRowNumber + 3}`);
      worksheet.getCell(`J${lastRowNumber + 3}`).value = '(ký, và ghi rõ họ tên)';
      worksheet.getCell(`J${lastRowNumber + 3}`).font = { italic: true };
      worksheet.getCell(`J${lastRowNumber + 3}`).alignment = { horizontal: 'center' };

      worksheet.columns.forEach((column) => {
        column.width = 25;
      });

      return workbook;
    } catch (error: any) {
      throw new AppError({
        id: `order.exportOrders`,
        message: 'Xuất báo cáo đơn hàng thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }
  async exportOrdersToPDF(filters: IOrderFilter) {
    const orders = await this.getStore().order().getList(filters);

    const doc = new jsPDF();

    // Title
    doc.setFontSize(16);
    doc.text('THỐNG KÊ ĐƠN HÀNG', 105, 15, { align: 'center' });

    doc.setFontSize(12);
    doc.text('CÔNG TY TNHH THỰC PHẨM QUẢNG ĐÀ', 105, 23, { align: 'center' });
    doc.text(`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`, 105, 30, { align: 'center' });

    const tableBody: any[] = [];

    orders.forEach((order) => {
      const address = getOrderAddress(order.shippingAddress);
      const statusLabel = findOrderWithStatus(order.status)?.label || order.status;
      const customerName = order.user?.name || '';
      const customerEmail = order.user?.email || '';
      const customerPhone = order.user?.phoneNumber || '';
      const totalOrderAmount = formatCurrency(order.total || 0);

      if (Array.isArray(order.items)) {
        order.items.forEach((item) => {
          tableBody.push([
            order._id?.toString(),
            customerName,
            customerEmail,
            customerPhone,
            address,
            item.code || '---',
            item.name || '',
            item.quantity,
            formatCurrency(Number(item.price)),
            formatCurrency(Number(item.price) * item.quantity),
            totalOrderAmount,
            statusLabel,
          ]);
        });
      }
    });

    autoTable(doc, {
      startY: 35,
      head: [
        [
          'Mã ĐH',
          'Khách Hàng',
          'Email',
          'SĐT',
          'Địa chỉ',
          'Mã SP',
          'Tên SP',
          'SL',
          'Giá bán',
          'Thành tiền',
          'Tổng tiền',
          'Trạng thái',
        ],
      ],
      body: tableBody,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [22, 160, 133], halign: 'center' },
      theme: 'grid',
    });

    const finalY = (doc as any).lastAutoTable.finalY || 40;

    doc.setFontSize(11);
    doc.text('Người giao hàng', 40, finalY + 20, { align: 'center' });
    doc.text('Người nhận hàng', 170, finalY + 20, { align: 'center' });

    doc.setFontSize(9);
    doc.text('(ký, và ghi rõ họ tên)', 40, finalY + 26, { align: 'center' });
    doc.text('(ký, và ghi rõ họ tên)', 170, finalY + 26, { align: 'center' });

    // Xuất file (dành cho phía frontend hoặc viết buffer ở backend nếu dùng ở server)
    doc.save(`phieu-giao-hang-${Date.now()}.pdf`);
  }

  async updateOrderItemRefund(orderId: string, data: IOrderItem) {
    try {
      const order = await this.getStore().order().findById(orderId);

      if (!order) {
        throw new AppError({
          id: `${where}.string`,
          message: 'Dữ liệu không tồn tại trong hệ thống',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      await this.getStore().order().updateOrderItemRefund(orderId, data);
    } catch (error: any) {
      throw new AppError({
        id: `${where}.updateStatus`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportMissingProducts(filters: IOrderFilter) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Thiếu sản phẩm');

      // Header
      worksheet.addRow([
        'Tên Sản Phẩm',
        'Số lượng tồn kho',
        'Số lượng sản phẩm đã xác nhận',
        'Số lượng sản phẩm trong đơn hàng',
        'Số lượng đang thiếu',
      ]);

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

      const orders = await this.getStore().order().getStockOrderList(filters);

      orders?.forEach((item) => {
        const row = [
          item.product?.name ?? 'Không có tên',
          item.totalInventory ?? 0,
          item.totalOrder ?? 0,
          item.orderCount ?? 0,
          item.missingQuantity > 0 ? item.missingQuantity : 0,
        ];

        const rowRef = worksheet.addRow(row);

        rowRef.eachCell((cell) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        });
      });

      worksheet.columns.forEach((column) => {
        column.width = 25;
      });

      return workbook;
    } catch (error: any) {
      throw new AppError({
        id: `${where}.exportMissingProducts`,
        message: 'Xuất báo cáo thiếu sản phẩm thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportOrderDetailsToExcel(orderId: string) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Chi tiết đơn hàng');

    // Thêm tiêu đề phiếu
    worksheet.mergeCells('A1:E1');
    worksheet.getCell('A1').value = 'PHIẾU GIAO HÀNG';
    worksheet.getCell('A1').font = { bold: true, size: 16 };
    worksheet.getCell('A1').alignment = { vertical: 'middle', horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    worksheet.getCell('A2').value = 'CÔNG TY TNHH THỰC PHẨM QUẢNG ĐÀ';
    worksheet.getCell('A2').font = { italic: true, size: 12 };
    worksheet.getCell('A2').alignment = { horizontal: 'center' };

    worksheet.mergeCells('A3:E3');
    worksheet.getCell('A3').value = `Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`;
    worksheet.getCell('A3').alignment = { horizontal: 'center' };

    // Header bảng
    worksheet.addRow(['Tên hàng', 'Mã sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']);

    worksheet.getRow(4).eachCell((cell) => {
      cell.font = { bold: true, size: 12 };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    const order = await this.getStore().order().getOne(orderId);

    // Add item rows
    order?.items?.forEach((item: any) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const total = quantity * unitPrice;

      const row = [item.name ?? 'Không có tên', item.code ?? '---', quantity, unitPrice, total];
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

    // Lấy số dòng cuối cùng sau khi thêm dữ liệu
    const lastRowNum = worksheet.lastRow?.number || 0;
    worksheet.addRow([]); // dòng trống

    // Chèn chữ ký nằm hai bên của bảng, sát dưới bảng
    const signRowNum = lastRowNum + 2;

    // Người giao hàng (bên trái)
    worksheet.mergeCells(`A${signRowNum}:B${signRowNum}`);
    worksheet.getCell(`A${signRowNum}`).value = 'Người giao hàng';
    worksheet.getCell(`A${signRowNum}`).alignment = { horizontal: 'center' };

    // Người nhận hàng (bên phải)
    worksheet.mergeCells(`D${signRowNum}:E${signRowNum}`);
    worksheet.getCell(`D${signRowNum}`).value = 'Người nhận hàng';
    worksheet.getCell(`D${signRowNum}`).alignment = { horizontal: 'center' };

    // Dòng ghi chú ký tên
    worksheet.mergeCells(`A${signRowNum + 1}:B${signRowNum + 1}`);
    worksheet.getCell(`A${signRowNum + 1}`).value = '(ký, và ghi rõ họ tên)';
    worksheet.getCell(`A${signRowNum + 1}`).font = { italic: true };
    worksheet.getCell(`A${signRowNum + 1}`).alignment = { horizontal: 'center' };

    worksheet.mergeCells(`D${signRowNum + 1}:E${signRowNum + 1}`);
    worksheet.getCell(`D${signRowNum + 1}`).value = '(ký, và ghi rõ họ tên)';
    worksheet.getCell(`D${signRowNum + 1}`).font = { italic: true };
    worksheet.getCell(`D${signRowNum + 1}`).alignment = { horizontal: 'center' };

    return workbook;
  }

  async exportOrderDetailsToPDF(orderId: string): Promise<Buffer> {
    const order = await this.getStore().order().getOne(orderId);

    const doc = new jsPDF();

    // Tiêu đề
    doc.setFontSize(16);
    doc.text('PHIẾU GIAO HÀNG', 105, 15, { align: 'center' });

    // Công ty
    doc.setFontSize(12);
    doc.text('CÔNG TY TNHH THỰC PHẨM QUẢNG ĐÀ', 105, 23, { align: 'center' });

    // Ngày lập
    doc.text(`Ngày lập: ${new Date().toLocaleDateString('vi-VN')}`, 105, 30, { align: 'center' });

    // Chuẩn bị dữ liệu bảng
    const tableBody: any[] = [];

    order?.items?.forEach((item: any) => {
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unitPrice) || 0;
      const total = quantity * unitPrice;

      tableBody.push([
        item.name ?? 'Không có tên',
        item.code ?? '---',
        quantity,
        unitPrice.toLocaleString('vi-VN'),
        total.toLocaleString('vi-VN'),
      ]);
    });

    // Vẽ bảng
    autoTable(doc, {
      startY: 40,
      head: [['Tên hàng', 'Mã sản phẩm', 'Số lượng', 'Đơn giá', 'Thành tiền']],
      body: tableBody,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [22, 160, 133] },
      theme: 'grid',
    });

    const finalY = (doc as any).lastAutoTable.finalY || 50;

    // Ký tên
    doc.setFontSize(11);
    doc.text('Người giao hàng', 40, finalY + 20, { align: 'center' });
    doc.text('Người nhận hàng', 170, finalY + 20, { align: 'center' });

    doc.setFontSize(9);
    doc.text('(ký, và ghi rõ họ tên)', 40, finalY + 26, { align: 'center' });
    doc.text('(ký, và ghi rõ họ tên)', 170, finalY + 26, { align: 'center' });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    return pdfBuffer;
  }

  async exportUserDebtToExcel() {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Người dùng đang nợ');

    // Header
    worksheet.addRow([
      'Tên người dùng',
      'Email',
      'Số điện thoại',
      'Tổng số đơn hàng đang nợ',
      'Tổng số tiền bị nợ',
    ]);

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

    const userDebtList = await this.getStore().order().getUserDebtList();

    userDebtList.forEach((item: any) => {
      const { user, totalOrder, totalDebt } = item;
      const row = [
        user?.name ?? 'Không có tên',
        user?.email ?? '---',
        user?.phone ?? '---',
        totalOrder || 0,
        totalDebt || 0,
      ];

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
      column.width = 25;
    });

    return workbook;
  }
}
