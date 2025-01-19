"use client"

import * as React from "react"

import "../styles/gpt.css"

import Head from "next/head"
import Script from "next/script"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
    DropdownMenuItem,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator
} from "@/components/ui/dropdown-menu"
import Bubble from "@/components/ui/chat-bubble"
import { remark } from 'remark';
import html from 'remark-html';
import Parser from 'html-react-parser';



export default function DropdownMenuCheckboxes() {
    const [mode, setMode] = React.useState("jee")
    const [chats, setChats] = React.useState({"aaaaaaa": "Chat 1"})
    const [currentChat, setCurrentChat] = React.useState("aaaaa")
    const [chatsContent, setchatsContent] = React.useState([])

    const [lastMsgTime, setLastMsgTime] = React.useState(0)


    function newChat() {
        const chatName = prompt("Enter chat name")
        if (!chatName) return
        const chatId = Math.random().toString(36).substring(7)
        setChats({ ...chats, [chatId]: chatName })
        saveChats({ ...chats, [chatId]: chatName })
        localStorage.setItem(`chats-${chatId}`, JSON.stringify([]))
        setCurrentChat(chatId)
        loadChatContent(chatId)
    }

    function loadChats() {
        // fetch chats from local storage
        console.log(chats)
        let chatss = localStorage.getItem("chats")
        if (!chatss) {
            chatss = saveChats()
        } else {
            chatss = JSON.parse(chatss)
        }
        setChats(chatss)
    }

    function saveChats(chats_t = chats) {
        localStorage.setItem("chats", JSON.stringify(chats_t))
        return chats_t
    }

    function loadChatContent(chat_id = currentChat) {
        loadChats()
        let chatsContent = localStorage.getItem(`chats-${chat_id}`)
        if (!chatsContent) {
            return
        } else {
            chatsContent = JSON.parse(chatsContent)
        }
        setchatsContent(chatsContent)
    }

    function saveChatContent(chats_t = chatsContent) {
        saveChats()
        localStorage.setItem(`chats-${currentChat}`, JSON.stringify(chats_t))
    }

    function addChat(text, user) {
        if (!text) return
        setchatsContent([...chatsContent, { text, user }])
        const chat = document.querySelector(".chats")
        saveChatContent([...chatsContent, { text, user }])
        chat.scrollTop = chat.scrollHeight
    } 

    async function queryAI(query) {
        const payload = {
            "query": query,
            "dataset": mode,
            "conversation": chatsContent
        }
        const response = await fetch("/api/ai", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        })
        let data = await response.json()
        const result = await remark().use(html).process(data.answer)
        return result.value
    }

    async function processQuery() {
        const text = document.querySelector(".input input").value
        if (!text) return
        if (Date.now() - lastMsgTime < 5000) {
            addChat("Please wait for 5 seconds before sending another message", false)
            return
        }
        addChat(text, true)
        document.querySelector(".input input").value = ""
        let ans = await queryAI(text)

        setchatsContent([...chatsContent, { text: text, user: true }, { text: ans, user: false }])
        const chat = document.querySelector(".chats")
        saveChatContent([...chatsContent, { text: text, user: true }, { text: ans, user: false }])
        
        chat.scrollTop = chat.scrollHeight
        setLastMsgTime(Date.now())
    }

    React.useEffect(() => {
        loadChats()
    }, [])

    return (
        <>
        <Head>
            <title>GrafiteAI</title>
            <script id="MathJax-script" async src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
        </Head>
        
        <Script
            src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
            onLoad={() =>
            console.log(`script loaded correctly, window.FB has been populated`)
            }
        />
        <div className="grid grid-rows-[auto,1fr] h-screen">
            <div className="p-4 grid grid-cols-5 text-center">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline"><b>Chats</b></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="">
                        <DropdownMenuItem onClick={newChat} >New Chat</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuRadioGroup value={currentChat} onValueChange={setCurrentChat}>
                            {Object.keys(chats).map((chat, index) => (
                                <DropdownMenuRadioItem key={index} value={chat} onClick={()=> {console.log(`${chat}: ${chats[chat]}`); loadChatContent(chat)}} >{chats[chat]}</DropdownMenuRadioItem>
                            ))}
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
                <h1 className="col-span-3 text-4xl">GrafiteAI</h1>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline">{mode.toUpperCase()}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="">
                        <DropdownMenuRadioGroup value={mode} onValueChange={setMode}>
                            <DropdownMenuRadioItem value="jee">JEE</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="neet">NEET</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <div className="grid p-4 grid-rows-[1fr,auto] overflow-hidden">
                <div className="chats overflow-y-scroll p-4">
                    {chatsContent.map((chat, index) => (
                        <Bubble key={index} user={chat.user}>{Parser(chat.text)}</Bubble>
                    ))}
                </div>
                <div className="input grid gap-4 grid-cols-[1fr,auto]">
                    <Input type="text" className="w-full h-12 border-2 border-gray-500 rounded-md p-4" />
                    <Button variant="outline" className="h-12" onClick={processQuery}>Send</Button>
                </div>
            </div>
        </div>
        </>
    )
}
