const { performance } = require('perf_hooks')
const { getDatabase } = require('../src/lib/database')
const { getAllPlugins, getCommandsByCategory, getCategories, pluginStore } = require('../src/lib/plugins')
const config = require('../config')

function toSmallCaps(text) {
    const smallCapsMap = {
        a:'ᴀ', b:'ʙ', c:'ᴄ', d:'ᴅ', e:'ᴇ', f:'ꜰ', g:'ɢ', h:'ʜ', i:'ɪ',
        j:'ᴊ', k:'ᴋ', l:'ʟ', m:'ᴍ', n:'ɴ', o:'ᴏ', p:'ᴘ', q:'ǫ', r:'ʀ',
        s:'s', t:'ᴛ', u:'ᴜ', v:'ᴠ', w:'ᴡ', x:'x', y:'ʏ', z:'ᴢ'
    }
    return text.toLowerCase().split('').map(c => smallCapsMap[c] || c).join('')
}

const CATEGORY_EMOJIS = {
    owner:'👑', main:'🏠', utility:'🔧', fun:'🎮', group:'👥',
    download:'📥', search:'🔍', tools:'🛠️', sticker:'🖼️',
    ai:'🤖', game:'🎯', media:'🎬', info:'ℹ️', religi:'☪️',
    panel:'🖥️', user:'📊', linode:'☁️', random:'🎲',
    canvas:'🎨', vps:'🌊', store:'🏪', premium:'💎',
    convert:'🔄', economy:'💰'
}

async function handleCommand(m, sock) {
try {
    if (!m.isCommand) return { handled:false }

    const command = m.command?.toLowerCase()
    if (!command) return { handled:false }

    getDatabase()

    switch (command) {

    case "cping":
    case "cspeed":
    case "clatency": {
        try {
            if (config.features?.autoTyping)
                await sock.sendPresenceUpdate("composing", m.chat)

            const start = performance.now()
            await m.react('⏳')

            const msgTimestamp = m.messageTimestamp ? m.messageTimestamp * 1000 : Date.now()
            const latency = Math.max(1, Date.now() - msgTimestamp)
            const processTime = (performance.now() - start).toFixed(2)

            let pingStatus = '🟢 Excellent'
            if (latency > 100 && latency <= 300) pingStatus = '🟡 Good'
            else if (latency > 300) pingStatus = '🔴 Poor'

            await m.reply(
`⚡ *CASE SYSTEM PING*

╭┈┈⬡「 📊 *sᴛᴀᴛᴜs* 」
┃ ◦ Latency: *${latency}ms*
┃ ◦ Process: *${processTime}ms*
┃ ◦ Status: ${pingStatus}
╰┈┈⬡`
            )

            await m.react('✅')

            if (config.features?.autoTyping)
                await sock.sendPresenceUpdate("paused", m.chat)

        } catch (e) {
            await m.react('❌')
            await m.reply(e.message)
        }
        return { handled:true }
    }

    case "lcase":
    case "caselist":
    case "allcase":
    case "listallcase": {

        const casesByCategory = {
            info: ['cping','listallcase','listallplugin','cekkontol']
        }

        const caseAliases = {
            cping:['cspeed','clatency'],
            listallcase:['lcase','caselist','allcase'],
            listallplugin:['lplugin','pluginlist','allplugin']
        }

        let totalCases = Object.values(casesByCategory)
            .reduce((a,b)=>a+b.length,0)

        let text =
`╔══════════════════╗
   📦 *${toSmallCaps('CASE LIST')}*
╚══════════════════╝

╭┈┈⬡「 📊 *ɪɴꜰᴏ* 」
┃ ◦ Total: *${totalCases}* cases
┃ ◦ Kategori: *${Object.keys(casesByCategory).length}*
╰┈┈⬡

`

        for (const category in casesByCategory) {
            const emoji = CATEGORY_EMOJIS[category] || '📌'
            text += `╭┈┈⬡「 ${emoji} *${toSmallCaps(category)}* 」\n`

            casesByCategory[category].forEach((cmd,i)=>{
                const alias = caseAliases[cmd]
                    ? ` (${caseAliases[cmd].slice(0,2).join(', ')})`
                    : ''
                text += `┃ ${i+1}. ${m.prefix || '.'}${cmd}${alias}\n`
            })

            text += `╰┈┈⬡\n\n`
        }

        await m.reply(text)
        return { handled:true }
    }

    case "cekkontol": {
        try {
            // Ambil parameter dengan cara yang lebih reliable
            let nama = (m.text || '').replace(/^\.cekkontol\s*/i, '').trim()
            
            // Jika tidak ada nama dari text, cek m.args atau quoted
            if (!nama && m.args && m.args.length > 0) {
                nama = m.args.join(' ').trim()
            }

            if (!nama) {
                await m.reply("❗ Silahkan masukkan nama.\n\nContoh:\n.cekkontol dudung\n.cekkontol jirjat")
                return { handled: true }
            }

            // Generate hasil berdasarkan panjang nama (deterministik)
            const namaLength = nama.length
            const seed = nama.toLowerCase().charCodeAt(0) + namaLength
            const random = seed % 5

            const hasilData = {
                0: {
                    emoji: "🤏",
                    ukuran: "Sangat Kecil",
                    persen: "15%",
                    deskripsi: "Seperti kacang panjang yang sudah tua",
                    reaksi: "😅"
                },
                1: {
                    emoji: "😐",
                    ukuran: "Sedang",
                    persen: "40%",
                    deskripsi: "Cukup layak untuk dibanggakan",
                    reaksi: "😌"
                },
                2: {
                    emoji: "🍆",
                    ukuran: "Besar",
                    persen: "65%",
                    deskripsi: "Mantap! Lumayan itu bro",
                    reaksi: "😏"
                },
                3: {
                    emoji: "🐉",
                    ukuran: "MONSTER",
                    persen: "90%",
                    deskripsi: "WAH! DAHSYAT SEKALI!!!",
                    reaksi: "🤯"
                },
                4: {
                    emoji: "❌",
                    ukuran: "tidak punya",
                    persen: "0%",
                    deskripsi: "Sepertinya bermasalah...",
                    reaksi: "😭"
                }
            }

            const hasil = hasilData[random]

            await m.reply(
`╔════════════════════════╗
   ${hasil.emoji} *CEK KONTOL ANALYZER* ${hasil.emoji}
╚════════════════════════╝

👤 *Target:* ${nama}
📊 *Hasil Analisis*
├ Ukuran: *${hasil.ukuran}*
├ Persentase: *${hasil.persen}*
├ Deskripsi: ${hasil.deskripsi}
└ Akurasi: 99.9% ✓`
            )

            await m.react(hasil.reaksi)
        } catch (e) {
            await m.reply("❌ Error: " + e.message)
        }
        return { handled: true }
    }

    case "lplugin":
    case "pluginlist":
    case "allplugin":
    case "listallplugin": {

        const categories = getCategories()
        const commandsByCategory = getCommandsByCategory()

        let text = `🔌 *PLUGIN LIST*\n\n`

        for (const category of categories.sort()) {
            const cmds = commandsByCategory[category] || []
            if (!cmds.length) continue

            text += `📂 ${category}\n`

            cmds.forEach((cmd,i)=>{
                text += `${i+1}. ${m.prefix || '.'}${cmd}\n`
            })

            text += `\n`
        }

        await m.reply(text)
        return { handled:true }
    }

    default:
        return { handled:false }
    }

} catch (e) {
    await m.reply(e.message)
    return { handled:true }
}
}

function getCaseCommands() {
    return {
        info: ['cping','listallcase','listallplugin','cekkontol']
    }
}

function getCaseCount() {
    return Object.values(getCaseCommands())
        .reduce((a,b)=>a+b.length,0)
}

function getCaseCategories() {
    return Object.keys(getCaseCommands())
}

function getCasesByCategory() {
    return getCaseCommands()
}

module.exports = {
    handleCommand,
    getCaseCommands,
    getCaseCount,
    getCaseCategories,
    getCasesByCategory
}
