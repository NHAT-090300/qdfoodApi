import ExcelJS from 'exceljs';
import { StatusCodes } from 'http-status-codes';
import { EUnitDisplay, IProductPriceFilter } from 'interface';
import { AppError, ProductPrice } from 'model';
import moment from 'moment';
import { ObjectId } from 'mongodb';

import BaseApp from './base';

const where = 'App.productPrice';

export class ProductPriceApp extends BaseApp {
  async getPaginateAdmin(filters: IProductPriceFilter) {
    try {
      const result = await this.getStore().productPrice().getPaginateAdmin(filters);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async bulkCreateProductPrice(userId: string, productIds: string[]) {
    try {
      return this.getStore().productPrice().bulkProductPrice(userId, productIds);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async bulkCreateProductPriceWithPrice(
    userId: string,
    products: { code: string; price: number }[],
  ) {
    const validProducts: { code: string; price: number }[] = [];
    const errors: { code: string; message: string }[] = [];

    const seenCodes = new Set<string>();

    products.forEach((item, index) => {
      const { code, price } = item;

      if (!code || typeof code !== 'string' || code.trim() === '') {
        errors.push({ code: `row_${index + 2}`, message: 'Mã sản phẩm không hợp lệ' });
        return;
      }

      const trimmedCode = code.trim();
      if (seenCodes.has(trimmedCode)) {
        errors.push({ code: trimmedCode, message: 'Mã sản phẩm bị trùng trong danh sách' });
        return;
      }
      seenCodes.add(trimmedCode);

      if (typeof price !== 'number' || Number.isNaN(price) || price <= 0) {
        errors.push({ code: trimmedCode, message: 'Giá phải là số dương' });
        return;
      }

      validProducts.push({ code: trimmedCode, price });
    });

    if (validProducts.length === 0) {
      throw new AppError({
        id: `${where}.bulkCreate`,
        message: 'Không có sản phẩm hợp lệ để tạo đề xuất giá',
        statusCode: StatusCodes.BAD_REQUEST,
        detail: { errors },
      });
    }

    try {
      // === 2. Kiểm tra sản phẩm tồn tại trong DB ===
      const codes = validProducts.map((p) => p.code);
      const existingProducts = await this.getStore()
        .product()
        .find({ code: { $in: codes } });

      const existingCodeMap = new Map(existingProducts.map((p) => [p.code, p._id]));

      const missingCodes = codes.filter((code) => !existingCodeMap.has(code));
      if (missingCodes.length > 0) {
        missingCodes.forEach((code) => {
          errors.push({ code, message: 'Sản phẩm không tồn tại trong hệ thống' });
        });
      }

      const finalProducts = validProducts
        .filter((p) => existingCodeMap.has(p.code))
        .map((p) => ({
          code: p.code,
          price: p.price,
          productId: existingCodeMap.get(p.code)!,
        }));

      let createdCount = 0;
      const created: { code: string; price: number }[] = [];

      if (finalProducts.length > 0) {
        await this.getStore()
          .productPrice()
          .bulkProductPriceWithPrice(
            userId,
            finalProducts.map((p) => ({
              code: p.code,
              price: p.price,
              productId: p.productId,
            })),
          );

        createdCount = finalProducts.length;
        created.push(...finalProducts.map((p) => ({ code: p.code, price: p.price })));
      }

      return {
        success: createdCount,
        failed: errors.length,
        errors,
        created,
      };
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.bulkCreate`,
        message: 'Tạo đề xuất giá hàng loạt thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error.message || error,
      });
    }
  }

  async syncPriceProposalsOneUser(userId: string) {
    try {
      const proposals = await this.getStore().productPriceProposal().getList({
        userId,
      });

      return this.getStore().productPrice().syncPriceProposals(proposals);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getPaginate`,
        message: 'Lấy danh sách productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getList(filters: IProductPriceFilter) {
    try {
      return await this.getStore().productPrice().getList(filters);
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getList`,
        message: 'Lấy danh sách productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getById(productPriceId: string) {
    try {
      const data = await this.getStore().productPrice().findById(productPriceId);

      if (!data) {
        throw new AppError({
          id: `${where}.getById`,
          message: 'ProductPrice không có hoặc chưa tồn tại',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu productPrice không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async getByUserId(userId: string) {
    try {
      const data = await this.getStore().productPrice().getList({
        userId,
      });

      if (!data) {
        throw new AppError({
          id: `${where}.getByUserId`,
          message: 'productPrice lấy dữ liệu không thành công',
          statusCode: StatusCodes.NOT_FOUND,
        });
      }

      return data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.getById`,
        message: 'Lấy dữ liệu productPrice không thành công',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async create(data: ProductPrice) {
    try {
      const result = await this.getStore().productPrice().createOne(data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.create`,
        message: 'Tạo productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async update(productPriceId: string, data: ProductPrice) {
    try {
      const result = await this.getStore().productPrice().updateOne(productPriceId, data);

      return result;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.update`,
        message: 'Cập nhật productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async delete(productPriceId: string) {
    try {
      await this.getStore()
        .productPrice()
        .baseDelete({ _id: new ObjectId(productPriceId) });
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      throw new AppError({
        id: `${where}.delete`,
        message: 'Cập nhật productPrice thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error,
      });
    }
  }

  async exportPriceList(userId: string, month: number = moment().month() + 1) {
    try {
      const userObjectId = new ObjectId(userId);
      const currentYear = moment().year();

      const pipeline = [
        // 1. BẮT ĐẦU TỪ PRODUCTS (KHÔNG SELF-LOOKUP)
        { $addFields: {} },

        // 2. GIÁ HIỆN TẠI
        {
          $lookup: {
            from: 'product_prices',
            let: { pid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$userId', userObjectId] }, { $eq: ['$productId', '$$pid'] }],
                  },
                },
              },
            ],
            as: 'current',
          },
        },
        { $unwind: { path: '$current', preserveNullAndEmptyArrays: true } },

        // 3. GIÁ ĐỀ XUẤT
        {
          $lookup: {
            from: 'product_price_proposals',
            let: { pid: '$_id' },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [{ $eq: ['$userId', userObjectId] }, { $eq: ['$productId', '$$pid'] }],
                  },
                },
              },
              { $sort: { createdAt: -1 } },
              { $limit: 1 },
            ],
            as: 'proposal',
          },
        },
        { $unwind: { path: '$proposal', preserveNullAndEmptyArrays: true } },

        // 4. CHỈ LẤY SP CÓ TRONG ÍT NHẤT 1 BẢNG (MERGE)
        {
          $match: {
            $or: [{ current: { $ne: null } }, { proposal: { $ne: null } }],
          },
        },

        // 5. PROJECT
        {
          $project: {
            _id: 0,
            name: '$name',
            unitName: { $ifNull: ['$unitName', null] },
            currentPrice: { $ifNull: ['$current.customPrice', 0] },
            proposalPrice: { $ifNull: ['$proposal.customPrice', 0] },
            code: { $ifNull: ['$code', ''] },
          },
        },
        {
          $match: {
            name: { $nin: [null, ''] },
          },
        },
      ];

      const data = await this.getStore().product().aggregate(pipeline);

      if (data.length === 0) {
        console.warn('Không có sản phẩm nào trong hệ thống');
      }

      // === TẠO EXCEL (giữ nguyên) ===
      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet('Bảng giá', {
        pageSetup: { paperSize: 9, orientation: 'landscape' },
      });

      // === HEADER CÔNG TY ===
      const addHeaderRow = (text: string, bold = false, size?: number) => {
        const row = sheet.addRow([text]);
        row.font = { name: 'Times New Roman', bold, size: size || 11 };
        row.alignment = { vertical: 'middle' };
        return row;
      };

      addHeaderRow('CÔNG TY TNHH QUANGDAFOOD', true, 16);
      addHeaderRow('116 Đô Đốc Lộc, Hòa Xuân, Cẩm Lệ, Đà Nẵng', false, 12);
      addHeaderRow('SĐT: 0905575527', false, 12);
      sheet.addRow([]);
      addHeaderRow('BẢNG GIÁ HÀNG THỰC PHẨM', true, 16);
      addHeaderRow(`ÁP DỤNG THÁNG ${month.toString().padStart(2, '0')}.${currentYear}`, false, 12);
      sheet.addRow([]);

      // === TABLE HEADER ===
      const headerRow = sheet.addRow([
        'STT',
        'MÃ SẢN PHẨM',
        'TÊN NGUYÊN LIỆU',
        'ĐVT',
        'SỐ LƯỢNG',
        `GIÁ HIỆN TẠI`,
        `GIÁ ĐỀ XUẤT`,
        'GHI CHÚ',
      ]);

      headerRow.eachCell((cell) => {
        cell.font = { name: 'Times New Roman', bold: true, color: { argb: '000000' }, size: 13 };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF92D050' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      });
      headerRow.height = 35;

      // === DATA ROWS ===
      data.forEach((item: any, index: number) => {
        const hasCurrent = typeof item.currentPrice === 'number' && item.currentPrice > 0;
        const hasProposal = typeof item.proposalPrice === 'number' && item.proposalPrice > 0;
        const diff = hasCurrent && hasProposal ? item.proposalPrice - item.currentPrice : 0;
        let note = '-';
        if (hasCurrent && hasProposal) {
          if (diff > 0) note = `Tăng ${diff.toLocaleString()}`;
          else if (diff < 0) note = `Giảm ${Math.abs(diff).toLocaleString()}`;
        }

        const row = sheet.addRow([
          index + 1,
          item.code || '',
          item.name || '',
          (EUnitDisplay as any)?.[item.unitName] || '',
          1,
          item.currentPrice,
          item.proposalPrice,
          note,
        ]);
        row.font = { name: 'Times New Roman', size: 13 };

        row.getCell(5).numFmt = '#,##0';
        row.getCell(6).numFmt = '#,##0';

        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(2).alignment = { horizontal: 'center' };
        row.getCell(3).alignment = { horizontal: 'center' };
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(5).alignment = { horizontal: 'center' };
        row.getCell(6).alignment = { horizontal: 'center' };
        row.getCell(7).alignment = { horizontal: 'center' };

        row.height = 25;
      });

      // === CỘT RỘNG + VIỀN ===
      const borderStyle = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' },
      } as const;

      sheet.columns = [
        { width: 6 },
        { width: 18 },
        { width: 35 },
        { width: 8 },
        { width: 18 },
        { width: 18 },
        { width: 18 },
        { width: 20 },
      ];

      const startRow = 8;
      const endRow = startRow + data.length;
      for (let r = startRow; r <= endRow; r++) {
        const row = sheet.getRow(r);
        row.eachCell((cell: any) => {
          cell.border = borderStyle;
        });
      }

      // === TRẢ VỀ BUFFER ===
      const buffer = await workbook.xlsx.writeBuffer();
      return buffer;
    } catch (error: any) {
      throw new AppError({
        id: 'PriceService.exportPriceList',
        message: 'Xuất Excel thất bại',
        statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
        detail: error.message,
      });
    }
  }
}
