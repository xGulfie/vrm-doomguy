Set oShell = CreateObject ("Wscript.Shell") 
Dim strArgs
strArgs = "yarn start --greenscreen --size 300"
oShell.Run strArgs, 0, false