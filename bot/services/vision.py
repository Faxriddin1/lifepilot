import structlog

logger = structlog.get_logger()


class VisionService:
    def __init__(self):
        self._client = None

    def _get_client(self):
        if self._client is None:
            from google.cloud import vision
            self._client = vision.ImageAnnotatorClient()
        return self._client

    async def extract_text(self, image_bytes: bytes) -> str:
        import asyncio
        from google.cloud import vision

        client = self._get_client()
        image = vision.Image(content=image_bytes)
        request = {"image": image, "features": [{"type_": vision.Feature.Type.TEXT_DETECTION}]}

        try:
            # Vision client is sync — run in thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(None, lambda: client.annotate_image(request))

            if response.error.message:
                logger.error("vision_api_error", error=response.error.message)
                return ""

            if response.text_annotations:
                text = response.text_annotations[0].description
                logger.info("vision_ocr_success", text_length=len(text))
                return text
            return ""
        except Exception as e:
            logger.error("vision_error", error=str(e))
            return ""
