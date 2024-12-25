import random
import string

def check(id):
    import random
    return random.randint(0, 2) != 0

def generate_unique_id(length=8):
    while True:
        
        new_id = ''.join(random.choices(string.digits, k=length))
        
        if not check(new_id):
            return new_id
        