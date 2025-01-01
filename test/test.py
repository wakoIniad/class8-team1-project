def check(id):
  import random
  return random.randint(0,2)!=0

print(check(10))
from PIL import features

if features.check("webp"):
    print("WebP対応しています！")
else:
    print("WebP対応していません。")