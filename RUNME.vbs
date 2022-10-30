Set oShell = CreateObject ("Wscript.Shell") 
Dim strArgs
strArgs = "node_modules\.bin\electron . --size 400 --always-on-top"
oShell.Run strArgs, 0, false