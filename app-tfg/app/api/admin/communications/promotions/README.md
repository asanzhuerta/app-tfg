# API promociones admin

CRUD de promociones y subida de adjuntos comerciales.

## Función

Crear y mantener promociones segmentadas por cliente, rango, producto o línea.

Campos principales:

- `promotionDiscountTypeCode`: `percentage_discount`, `volume_percentage_discount` o `gift_product`.
- `discountPercentage`: porcentaje para descuentos directos o por volumen.
- `minimumOrderAmount`: importe mínimo para activar el descuento por volumen.
- `giftProductId` / `giftDescription`: regalo del catálogo o merchandising externo.
- `imageUrl`: imagen mostrada junto al texto de la promoción.
- `attachmentUrl`, `attachmentName`, `attachmentMimeType`: PDF asociado.

El endpoint `POST /api/admin/communications/promotions/upload-attachment` acepta imágenes y PDF. Los PDF se suben a Cloudinary como recurso `raw` con nombre `.pdf` conservado y se muestran en la interfaz mediante URL de descarga.
