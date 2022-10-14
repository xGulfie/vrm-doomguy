Set oShell = CreateObject ("Wscript.Shell") 
Dim strArgs
strArgs = "yarn start --size 300 --always-on-top"
oShell.Run strArgs, 0, false