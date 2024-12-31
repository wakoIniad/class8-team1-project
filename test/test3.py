import time
import string

def generated_unique_id():
    characters = [ *string.digits, *string.ascii_letters ]
    l = len(characters)
    timestamp = int(time.time()*1000//1)
    def recrusion(n):
        i = n % l
        if n < l : return characters[i]
        n //= l
        return recrusion(n) + characters[i]
    return recrusion(timestamp)
print(generated_unique_id())
    



#print(recrusion(255,16))
#print(recrusion(16*15+1-1,16))



#60/60 -> 1:0