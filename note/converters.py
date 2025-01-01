class ShortURL:
    regex = "[a-zA-Z0-9]{1,16}"#"([a-zA-Z0-9_]{4,32})"

    def to_python(self, value):
        return str(value)

    def to_url(self, value):
        return str(value)
    
class NoteID:
    regex = "[a-zA-Z0-9]{1,16}"#"([a-zA-Z0-9]{16})"

    def to_python(self, value):
        return str(value)

    def to_url(self, value):
        return str(value)
    
class BoxID:
    regex = "[a-zA-Z0-9]{1,16}-[a-zA-Z0-9]{1,16}"#"([a-zA-Z0-9]{16})"

    def to_python(self, value):
        return str(value)

    def to_url(self, value):
        return str(value)