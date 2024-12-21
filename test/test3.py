def to_url(value):
    return str(value)[0:4]+str(value)[5:9]
print(to_url("0123-4567"))