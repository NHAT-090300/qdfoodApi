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
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

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
      const missingQuantity = Math.max(
        0,
        Math.round((item.quantity - inventoryQuantity) * 100) / 100,
      );

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
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

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
      if (error instanceof AppError) throw error;

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
      paymentAmount?: number;
    },
  ) {
    try {
      const order = await this.getStore().order().findById(orderId);

      if (!order) {
        throw new AppError({
          id: `${where}.updateStatus`,
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
            price: item.price,
            refundAmount: Math.round(Number(item.price) * Number(item.quantity) * 100) / 100,
            note: `Xuất kho tạo khi đơn hàng ${order._id?.toString()}`,
          });

          await this.getStore().inventoryTransaction().createOne(transaction);
        }
      }

      if (Number(data?.paymentAmount) > Number(order?.unpaidAmount)) {
        throw new AppError({
          id: `${where}.updateStatus`,
          message: 'Dữ liệu không tồn tại trong hệ thống',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const updateData: any = {
        ...data,
        unpaidAmount: 0,
      };

      if (data?.status === EOrderStatus.COMPLETED) {
        updateData.unpaidAmount = order?.total;
      }

      if (
        data?.status === EOrderStatus.PAID ||
        (data?.paymentAmount &&
          Number(order?.unpaidAmount || 0) === Number(data?.paymentAmount || 0))
      ) {
        updateData.status = EOrderStatus.PAID;
        updateData.unpaidAmount = 0;
        updateData.paymentVerifierId = new ObjectId(data.paymentVerifierId);
      }

      if (data?.status === EOrderStatus.DEBT) {
        updateData.unpaidAmount =
          Number(order?.unpaidAmount || 0) - Number(data?.paymentAmount || 0);
        updateData.paymentVerifierId = new ObjectId(data.paymentVerifierId);
      }

      delete updateData.paymentAmount;

      await this.getStore()
        .order()
        .baseUpdate({ _id: new ObjectId(orderId) }, { $set: updateData });
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.updateStatus`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async payDebtForOrders(
    userId: string,
    paymentAmount: number,
    paymentVerifierId: string,
  ): Promise<{ success: boolean; remainingAmount: number }> {
    try {
      let remainingAmount = Number(paymentAmount);

      // Lấy danh sách đơn theo thứ tự cũ → mới (ví dụ theo createdAt tăng dần)
      const orders = await this.getStore()
        .order()
        .find<any>({
          userId: new ObjectId(userId),
          unpaidAmount: { $gt: 0 },
        });

      for (const order of orders) {
        if (remainingAmount <= 0) break;

        const unpaid = Number(order.unpaidAmount || 0);
        let newUnpaid = unpaid;
        let newStatus = order.status;

        if (remainingAmount >= unpaid) {
          // Trả hết đơn này
          remainingAmount -= unpaid;
          newUnpaid = 0;
          newStatus = EOrderStatus.PAID;
        } else {
          // Trả một phần
          newUnpaid = unpaid - remainingAmount;
          remainingAmount = 0;
          newStatus = EOrderStatus.DEBT;
        }

        await this.getStore()
          .order()
          .baseUpdate(
            { _id: order._id },
            {
              $set: {
                unpaidAmount: newUnpaid,
                status: newStatus,
                paymentVerifierId: new ObjectId(paymentVerifierId),
                updatedAt: new Date(),
              },
            },
          );
      }

      return { success: true, remainingAmount };
    } catch (error: any) {
      throw new AppError({
        id: 'order.payDebtForOrders',
        message: 'Thanh toán công nợ thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportOrdersToExcel(filters: any) {
    const workbook = new ExcelJS.Workbook();
    const orders = await this.getStore().order().getList(filters);

    // Helper style
    function styleCell(
      cell: ExcelJS.Cell,
      opts: { bold?: boolean; size?: number; align?: 'left' | 'center' | 'right' } = {},
    ) {
      cell.font = {
        name: 'Times New Roman',
        size: opts.size ?? 13,
        bold: opts.bold ?? false,
      };
      cell.alignment = {
        horizontal: opts.align ?? 'left',
        vertical: 'middle',
      };
    }

    for (const [i, order] of orders.entries()) {
      const sheetName = `PXK_${i + 1}`;
      const worksheet = workbook.addWorksheet(sheetName);

      // Company Info
      worksheet.mergeCells('A1:G1');
      worksheet.getCell('A1').value = 'CÔNG TY TNHH QUẢNG ĐÀ FOOD';
      styleCell(worksheet.getCell('A1'), { bold: true, size: 13, align: 'left' });

      worksheet.mergeCells('A2:G2');
      worksheet.getCell('A2').value = 'VPĐH: 116-118 Đô Đốc Lộc, Hòa Xuân, Cẩm Lệ, Đà Nẵng.';
      styleCell(worksheet.getCell('A2'), { size: 13, align: 'left' });

      // Title
      worksheet.mergeCells('A4:G4');
      worksheet.getCell('A4').value = 'PHIẾU XUẤT KHO';
      styleCell(worksheet.getCell('A4'), { bold: true, size: 15, align: 'center' });

      // Ngày & Mã phiếu
      worksheet.mergeCells('A5:E5');
      worksheet.getCell('A5').value =
        `Ngày ${new Date().getDate()} Tháng ${new Date().getMonth() + 1} Năm ${new Date().getFullYear()}`;
      styleCell(worksheet.getCell('A5'), { size: 13, align: 'center' });

      worksheet.mergeCells('F5:G5');
      worksheet.getCell('F5').value = `PXK: ${order._id}`;
      styleCell(worksheet.getCell('F5'), { bold: true, size: 13, align: 'right' });

      // Thông tin nhận hàng
      worksheet.mergeCells('A7:B7');
      worksheet.getCell('A7').value = 'Người nhận hàng';
      styleCell(worksheet.getCell('A7'), { bold: true });

      worksheet.mergeCells('A8:B8');
      worksheet.getCell('A8').value = 'Đơn vị nhận hàng';
      styleCell(worksheet.getCell('A8'), { bold: true });
      worksheet.getCell('C8').value = order?.user?.name ?? '';
      styleCell(worksheet.getCell('C8'));

      worksheet.mergeCells('A9:B9');
      worksheet.getCell('A9').value = 'Nội dung:';
      styleCell(worksheet.getCell('A9'), { bold: true });
      worksheet.getCell('C9').value = order.note ?? '';
      styleCell(worksheet.getCell('C9'));

      worksheet.mergeCells('A10:B10');
      worksheet.getCell('A10').value = 'Thời gian giao:';
      styleCell(worksheet.getCell('A10'), { bold: true });
      worksheet.getCell('C10').value = '';
      styleCell(worksheet.getCell('C10'));

      worksheet.mergeCells('A11:B11');
      worksheet.getCell('A11').value = 'Thời gian thực giao:';
      styleCell(worksheet.getCell('A11'), { bold: true });
      worksheet.getCell('C11').value = '';
      styleCell(worksheet.getCell('C11'));

      // Table Header
      const header = ['STT', 'MÃ HH', 'Tên hàng', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền'];
      const headerRow = worksheet.addRow(header);
      headerRow.eachCell((cell) => {
        styleCell(cell, { bold: true, size: 14, align: 'center' });
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });

      // Items
      let totalQty = 0;
      let totalMoney = 0;
      order.items?.forEach((item: any, index: number) => {
        const quantity = Number(item.quantity) - Number(item.damagedQuantity) || 0;
        const price = Number(item?.price) || 0;
        const lineTotal = quantity * price;
        totalQty += quantity;
        totalMoney += lineTotal;

        const row = worksheet.addRow([
          index + 1,
          item.code ?? '-',
          item.name ?? 'Không có tên',
          item.unitName ?? '-',
          quantity,
          price?.toLocaleString('vi-VN'),
          lineTotal?.toLocaleString('vi-VN'),
        ]);

        row.eachCell((cell, colNumber) => {
          if (colNumber === 3) styleCell(cell, { size: 14, align: 'left' });
          else if (colNumber === 6 || colNumber === 7)
            styleCell(cell, { size: 14, align: 'right' });
          else styleCell(cell, { size: 14, align: 'center' });

          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' },
          };
        });
      });

      // Summary
      worksheet.addRow([]);
      worksheet.addRow(['', '', '', 'Tổng số lượng', '', totalQty, '']);
      worksheet.addRow(['', '', '', 'Tổng tiền hàng', '', totalMoney?.toLocaleString('vi-VN'), '']);
      worksheet.addRow(['', '', '', 'Thuế GTGT 8%', '', '', '']);
      worksheet.addRow(['', '', '', 'Tổng cộng', '', totalMoney?.toLocaleString('vi-VN'), '']);

      const startRow = worksheet.lastRow!.number - 3;
      const endRow = worksheet.lastRow!.number;

      for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
        worksheet.mergeCells(`D${rowIndex}:E${rowIndex}`);
        styleCell(worksheet.getCell(`D${rowIndex}`), { size: 13, align: 'center', bold: true });
        worksheet.getRow(rowIndex).eachCell((cell, colNumber) => {
          styleCell(
            cell,
            colNumber <= 5 ? { size: 13, align: 'left' } : { size: 13, align: 'right' },
          );
        });
      }

      worksheet.addRow([]);
      worksheet.addRow([]);
      const sigRow = worksheet.addRow([
        'Người lập phiếu',
        '',
        'Người giao hàng',
        'Bảo vệ',
        '',
        'Phụ trách bếp',
        'Giám đốc cơ sở',
      ]);

      worksheet.mergeCells(`A${sigRow.number}:B${sigRow.number}`);
      worksheet.mergeCells(`D${sigRow.number}:E${sigRow.number}`);
      styleCell(worksheet.getCell(`A${sigRow.number}`), { size: 13, align: 'center', bold: true });
      sigRow.eachCell((cell, colNumber) => {
        if (colNumber > 2) styleCell(cell, { size: 13, align: 'center', bold: true });
      });

      const sigNote = worksheet.addRow([
        '(Kí và ghi rõ tên)',
        '',
        '(Kí và ghi rõ tên)',
        '(Kí và ghi rõ tên)',
        '',
        '(Kí và ghi rõ tên)',
        '(Kí và ghi rõ tên)',
      ]);

      worksheet.mergeCells(`A${sigNote.number}:B${sigNote.number}`);
      worksheet.mergeCells(`D${sigNote.number}:E${sigNote.number}`);
      styleCell(worksheet.getCell(`A${sigNote.number}`), { size: 13, align: 'center' });
      sigNote.eachCell((cell, colNumber) => {
        if (colNumber > 2) styleCell(cell, { size: 13, align: 'center' });
      });

      // Column widths
      worksheet.getColumn(2).width = 20;
      worksheet.getColumn(3).width = 30;
      worksheet.getColumn(6).width = 20;
      worksheet.getColumn(7).width = 20;
    }

    return workbook;
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

  async updateOrderItemRefund(orderId: string, data: IOrderItem & { reason: string }) {
    try {
      const order = await this.getStore().order().findById(orderId);

      if (!order) {
        throw new AppError({
          id: `${where}.string`,
          message: 'Dữ liệu không tồn tại trong hệ thống',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      if (!data.quantity || data.quantity <= 0) {
        throw new AppError({
          id: `${where}.updateOrderItemRefund`,
          message: 'Số lượng phải lớn hơn 0',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      const inventoryTransaction = await InventoryTransaction.sequelize({
        productId: data.productId,
        quantity: data.quantity,
        type: EInventoryTransactionType.REFUND,
        note: `${data.reason || 'Hoàn trả lại hàng'} - đơn hàng ${orderId}`,
        orderId: order._id,
        refundAmount: Math.round(Number(data.price) * Number(data.quantity) * 100) / 100,
      });

      // update orderItem
      await this.getStore().order().updateOrderItemRefund(orderId, data);

      // update inventory
      await this.getStore()
        .inventory()
        .baseUpdate(
          {
            productId: new ObjectId(data?.productId),
          },
          {
            $inc: {
              quantity: data?.quantity,
            },
          },
        );

      // create inventory transaction
      await this.getStore().inventoryTransaction().createOne(inventoryTransaction);
    } catch (error: any) {
      console.log(error);
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.updateStatus`,
        message: 'Cập nhật order thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async updateOrderItemQuantity(orderId: string, data: IOrderItem) {
    try {
      const order = await this.getStore().order().findById(orderId);

      if (!order) {
        throw new AppError({
          id: `${where}.string`,
          message: 'Dữ liệu không tồn tại trong hệ thống',
          statusCode: StatusCodes.BAD_REQUEST,
        });
      }

      await this.getStore().order().updateOrderItemQuantity(orderId, data);
    } catch (error: any) {
      console.log(error);
      if (error instanceof AppError) throw error;

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
    const worksheet = workbook.addWorksheet('PHIẾU XUẤT KHO');

    // Helper style
    function styleCell(
      cell: ExcelJS.Cell,
      opts: { bold?: boolean; size?: number; align?: 'left' | 'center' | 'right' } = {},
    ) {
      cell.font = {
        name: 'Times New Roman',
        size: opts.size ?? 13,
        bold: opts.bold ?? false,
      };
      cell.alignment = {
        horizontal: opts.align ?? 'left',
        vertical: 'middle',
      };
    }

    // Lấy order từ DB
    const order = await this.getStore().order().getOne(orderId);
    if (!order) throw new Error('Order not found');

    // Company Info
    worksheet.mergeCells('A1:G1');
    worksheet.getCell('A1').value = 'CÔNG TY TNHH QUẢNG ĐÀ FOOD';
    styleCell(worksheet.getCell('A1'), { bold: true, size: 13, align: 'left' });

    worksheet.mergeCells('A2:G2');
    worksheet.getCell('A2').value = 'VPĐH: 116-118 Đô Đốc Lộc, Hòa Xuân, Cẩm Lệ, Đà Nẵng.';
    styleCell(worksheet.getCell('A2'), { size: 13, align: 'left' });

    // Title
    worksheet.mergeCells('A4:G4');
    worksheet.getCell('A4').value = 'PHIẾU XUẤT KHO';
    styleCell(worksheet.getCell('A4'), { bold: true, size: 15, align: 'center' });

    // Ngày & Mã phiếu
    worksheet.mergeCells('A5:E5');
    worksheet.getCell('A5').value =
      `Ngày ${new Date().getDate()} Tháng ${new Date().getMonth() + 1} Năm ${new Date().getFullYear()}`;
    styleCell(worksheet.getCell('A5'), { size: 13, align: 'center' });

    worksheet.mergeCells('F5:G5');
    worksheet.getCell('F5').value = `PXK: ${orderId}`;
    styleCell(worksheet.getCell('F5'), { bold: true, size: 13, align: 'right' });

    // Thông tin nhận hàng
    worksheet.mergeCells('A7:B7');
    worksheet.getCell('A7').value = 'Người nhận hàng';
    styleCell(worksheet.getCell('A7'), { bold: true });

    worksheet.mergeCells('A8:B8');
    worksheet.getCell('A8').value = 'Đơn vị nhận hàng';
    styleCell(worksheet.getCell('A8'), { bold: true });
    worksheet.getCell('C8').value = order?.user?.name ?? '';
    styleCell(worksheet.getCell('C8'));

    worksheet.mergeCells('A9:B9');
    worksheet.getCell('A9').value = 'Nội dung:';
    styleCell(worksheet.getCell('A9'), { bold: true });
    worksheet.getCell('C9').value = order.note ?? '';
    styleCell(worksheet.getCell('C9'));

    worksheet.mergeCells('A10:B10');
    worksheet.getCell('A10').value = 'Thời gian giao:';
    styleCell(worksheet.getCell('A10'), { bold: true });
    worksheet.getCell('C10').value = '';
    styleCell(worksheet.getCell('C10'));

    worksheet.mergeCells('A11:B11');
    worksheet.getCell('A11').value = 'Thời gian thực giao:';
    styleCell(worksheet.getCell('A11'), { bold: true });
    worksheet.getCell('C11').value = '';
    styleCell(worksheet.getCell('C11'));
    styleCell(worksheet.getCell('C12'));

    // Table Header
    const header = ['STT', 'MÃ HH', 'Tên hàng', 'ĐVT', 'SL', 'Đơn giá', 'Thành tiền'];
    const headerRow = worksheet.addRow(header);
    headerRow.eachCell((cell) => {
      styleCell(cell, { bold: true, size: 14, align: 'center' });
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      };
    });

    // Items
    let totalQty = 0;
    let totalMoney = 0;
    order.items?.forEach((item: any, index: number) => {
      const quantity = Number(item.quantity) - Number(item.damagedQuantity) || 0;
      const price = Number(item?.price) || 0;
      const lineTotal = quantity * price;
      totalQty += quantity;
      totalMoney += lineTotal;

      const row = worksheet.addRow([
        index + 1,
        item.code ?? '-',
        item.name ?? 'Không có tên',
        item.unitName ?? '-',
        quantity,
        price?.toLocaleString('vi-VN'),
        lineTotal?.toLocaleString('vi-VN'),
      ]);

      row.eachCell((cell, colNumber) => {
        if (colNumber === 3) styleCell(cell, { size: 14, align: 'left' });
        else if (colNumber === 6 || colNumber === 7) styleCell(cell, { size: 14, align: 'right' });
        else styleCell(cell, { size: 14, align: 'center' });

        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
      });
    });

    // Summary
    worksheet.addRow([]);
    worksheet.addRow(['', '', '', 'Tổng số lượng', '', totalQty, '']);
    worksheet.addRow(['', '', '', 'Tổng tiền hàng', '', totalMoney?.toLocaleString('vi-VN'), '']);
    worksheet.addRow(['', '', '', 'Thuế GTGT 8%', '', '', '']);
    worksheet.addRow(['', '', '', 'Tổng cộng', '', totalMoney?.toLocaleString('vi-VN'), '']);

    const startRow = worksheet.lastRow!.number - 3;
    const endRow = worksheet.lastRow!.number;

    for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
      // Merge D-E cho từng dòng
      worksheet.mergeCells(`D${rowIndex}:E${rowIndex}`);

      // Style cho tiêu đề (cột D-E)
      styleCell(worksheet.getCell(`D${rowIndex}`), { size: 13, align: 'center', bold: true });

      worksheet.getRow(rowIndex).eachCell((cell, colNumber) => {
        styleCell(
          cell,
          colNumber <= 5 ? { size: 13, align: 'left' } : { size: 13, align: 'right' },
        );
      });
    }

    worksheet.addRow([]);
    worksheet.addRow([]);
    const sigRow = worksheet.addRow([
      'Người lập phiếu',
      '',
      'Người giao hàng',
      'Bảo vệ',
      '',
      'Phụ trách bếp',
      'Giám đốc cơ sở',
    ]);

    // Merge A-B cho "Người lập phiếu"
    worksheet.mergeCells(`A${sigRow.number}:B${sigRow.number}`);
    worksheet.mergeCells(`D${sigRow.number}:E${sigRow.number}`);
    styleCell(worksheet.getCell(`A${sigRow.number}`), { size: 13, align: 'center', bold: true });
    sigRow.eachCell((cell, colNumber) => {
      if (colNumber > 2) styleCell(cell, { size: 13, align: 'center', bold: true });
    });

    const sigNote = worksheet.addRow([
      '(Kí và ghi rõ tên)',
      '',
      '(Kí và ghi rõ tên)',
      '(Kí và ghi rõ tên)',
      '',
      '(Kí và ghi rõ tên)',
      '(Kí và ghi rõ tên)',
    ]);

    // Merge A-B cho ghi chú "Người lập phiếu"
    worksheet.mergeCells(`A${sigNote.number}:B${sigNote.number}`);
    worksheet.mergeCells(`D${sigNote.number}:E${sigNote.number}`);
    styleCell(worksheet.getCell(`A${sigNote.number}`), { size: 13, align: 'center' });
    sigNote.eachCell((cell, colNumber) => {
      if (colNumber > 2) styleCell(cell, { size: 13, align: 'center' });
    });

    // Column widths
    worksheet.getColumn(2).width = 20; // tên hàng rộng gấp 3
    worksheet.getColumn(3).width = 30; // tên hàng rộng gấp 3
    worksheet.getColumn(6).width = 20; // đơn giá rộng gấp 2
    worksheet.getColumn(7).width = 20; // thành tiền rộng gấp 2

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
      const unitName = Number(item.unitName) || 0;
      const total = quantity * unitName;

      tableBody.push([
        item.name ?? 'Không có tên',
        item.code ?? '---',
        quantity,
        unitName.toLocaleString('vi-VN'),
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
