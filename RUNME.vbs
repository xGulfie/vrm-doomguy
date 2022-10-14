Set oShell = CreateObject ("Wscript.Shell") 
Dim strArgs
strArgs = "node_modules\.bin\electron . --size 400 --greenscreen"
oShell.Run strArgs, 0, false