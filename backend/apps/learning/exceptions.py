class LearningServiceError(Exception):
    pass


class TutorRateLimitError(LearningServiceError):
    pass
