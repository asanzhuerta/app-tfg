# API promociones admin

CRUD de promociones y subida de adjuntos comerciales.

## Funcion

Crear y mantener promociones segmentadas por cliente, rango, producto o linea.

Campos principales:

- `promotionDiscountTypeCode`: `percentage_discount`, `volume_percentage_discount` o `gift_product`.
- `discountPercentage`: porcentaje para descuentos directos o por volumen.
- `minimumOrderAmount`: importe minimo para activar el descuento por volumen.
- `giftProductId` / `giftDescription`: regalo del catalogo o merchandising externo.
- `imageUrl`: imagen mostrada junto al texto de la promocion.
- `attachmentUrl`, `attachmentName`, `attachmentMimeType`: PDF asociado.

El endpoint `POST /api/admin/communications/promotions/upload-attachment` acepta imagenes y PDF y devuelve la URL persistible en la promocion.
