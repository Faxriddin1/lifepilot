from rest_framework import status
from rest_framework.exceptions import APIException
from rest_framework.views import exception_handler


def custom_exception_handler(exc, context):
    """Стандартизированный обработчик ошибок DRF.

    Формат ответа:
    {
        "detail": "Описание ошибки",
        "code": "error_code",
        "errors": { "field": ["сообщение"] }  # только для ошибок валидации
    }
    """
    response = exception_handler(exc, context)

    if response is None:
        return response

    error_data = {
        'detail': '',
        'code': 'error',
    }

    if isinstance(response.data, dict):
        detail = response.data.get('detail')
        if detail:
            # Стандартная ошибка DRF с полем detail
            error_data['detail'] = str(detail)
            error_data['code'] = getattr(exc, 'default_code', 'error')
        else:
            # Ошибки валидации: {field: [messages]}
            error_data['detail'] = 'Ошибка валидации данных.'
            error_data['code'] = 'validation_error'
            error_data['errors'] = response.data
    elif isinstance(response.data, list):
        error_data['detail'] = response.data[0] if response.data else 'Ошибка.'
        error_data['code'] = getattr(exc, 'default_code', 'error')
    else:
        error_data['detail'] = str(response.data)

    # Маппинг кодов статуса на пользовательские сообщения при отсутствии detail
    status_messages = {
        status.HTTP_401_UNAUTHORIZED: ('Требуется авторизация.', 'not_authenticated'),
        status.HTTP_403_FORBIDDEN: ('Доступ запрещён.', 'permission_denied'),
        status.HTTP_404_NOT_FOUND: ('Ресурс не найден.', 'not_found'),
        status.HTTP_405_METHOD_NOT_ALLOWED: ('Метод не разрешён.', 'method_not_allowed'),
        status.HTTP_429_TOO_MANY_REQUESTS: ('Слишком много запросов, попробуйте позже.', 'throttled'),
    }

    if response.status_code in status_messages and not error_data['detail']:
        msg, code = status_messages[response.status_code]
        error_data['detail'] = msg
        error_data['code'] = code

    response.data = error_data
    return response
