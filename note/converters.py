def toSystemURLRegex(regexStr):
    return f'(SYSTEM|{regexStr})'

class ShortURL:
    regex = toSystemURLRegex("[a-zA-Z0-9]{1,16}")#"([a-zA-Z0-9_]{4,32})"

    def to_python(self, value):
        return str(value)

    def to_url(self, value):
        return str(value)
    
class NoteID:
    regex = toSystemURLRegex("[a-zA-Z0-9]{1,16}")#"([a-zA-Z0-9]{16})"

    def to_python(self, value):
        return str(value)

    def to_url(self, value):
        return str(value)
    
class BoxID:
    regex = toSystemURLRegex("[a-zA-Z0-9]{1,16}-[a-zA-Z0-9]{1,16}")#"([a-zA-Z0-9]{16})"

    def to_python(self, value):
        return str(value)

    def to_url(self, value):
        return str(value)