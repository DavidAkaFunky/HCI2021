f = open("count_1w.txt", "r")
arr = []
out = open("words.txt", "w")
input = f.read().splitlines()
for line in input:
    words = line.split()
    arr.append(words[0] + "\n")
out.writelines(arr)
f.close()
out.close()