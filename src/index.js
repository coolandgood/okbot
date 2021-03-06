const Discord = require('discord.js')
const config = require('../config')
const chalk = require('chalk')
const urlencode = require('urlencode')

const perms = 0x00000400 | 0x00000800 | 0x00002000 | 0x00008000
const scopes = [ 'bot' ]

console.log(chalk.bold(`Install okbot with the url: `) + `https://discordapp.com/oauth2/authorize?&client_id=${config.client.id}&scope=${scopes.join(',')}&permissions=${perms}&response_type=code`)

const inspect = obj =>
  console.log(require('util').inspect(obj, { depth: 2, colors: true }))

const client = new Discord.Client()

client.on('ready', () => {
  console.log('I am ready!')
})

client.on('message', msg => {
  if (!msg.content.startsWith('?'))
    return

  let [ cmd, ...args ] = msg.content.substr(1).split(' ')
  inspect(cmd, args)

  if (['text', 'txt', 't'].includes(cmd)) {
    // ?text <text>
    // outputs text in comic sans yexd
    let embed = new Discord.RichEmbed()
    let text = urlencode(args.join(' '))

    embed.setImage(`http://latex.codecogs.com/png.latex?\\inline%20\\fn_cs%20\\Huge%20{\\color{White}%20\\text{${text}}}`)
    embed.setAuthor(msg.member.nickname)
    embed.setDescription(args.join(' '))

    msg.channel.send({ embed })
  }

  if (['latex', 'tex', 'l'].includes(cmd)) {
    // ?latex <latex equation>
    let embed = new Discord.RichEmbed()
    let text = urlencode(args.join(' '))

    embed.setImage(`http://latex.codecogs.com/png.latex?\\inline%20\\fn_cs%20\\Huge%20{\\color{White}%20${text}}`)
    embed.setAuthor(msg.member.nickname)
    embed.setDescription(args.join(' '))

    msg.channel.send({ embed })
  }

  if (['e', 'eval', 'math'].includes(cmd)) {
    // ?eval <math>
    const compile = require('built-in-math-eval')
    let res = 'error xd'

    try {
      res = compile(args.join(' ')).eval()
    } catch(e) {}

    let embed = new Discord.RichEmbed()
    embed.setTitle(res)
    embed.setDescription(args.join(' '))

    msg.channel.send({ embed })
  }

  if (['regional_indicator', 'r'].includes(cmd)) {
    // ?r <text>
    // converts to :regional_indicator: cs
    let lower = args.join(' ').toLowerCase()
    let pattern = /^[a-zA-Z ]+$/
    if (!pattern.test(lower))
      return msg.channel.send('ms')

    let out = ''
    for (let char of lower) {
      if (char === ' ')
        out += '     '
      else if (char === 'b')
        out += ':b: '
      else
        out += `:regional_indicator_${char}: `
    }

    console.log(out)
    msg.channel.send(out)
  }

  if (['ascii', 'a'].includes(cmd)) {
    // ?ascii :emoji:
    let emoji
    try {
      emoji = args[0].split(':')[2]
      emoji = emoji.substr(0, emoji.length-1)
    } catch(e) {
      console.log(e)
      return msg.channel.send('ms')
    }

    let url = `https://cdn.discordapp.com/emojis/${emoji}.png`
    const imageToAscii = require('image-to-ascii')

    imageToAscii(url, {
      colored: false,
      size: { height: 24 },
      white_bg: false,
    }, (err, converted) => {
      if (err) {
        console.log(err)
        return msg.channel.send('ms')
      }

      msg.channel.send('```\n' + converted + '\n```')
    })
  }

  if (['img', 'i'].includes(cmd)) {
    // ?i url
    let url = args[0]
    const imageToAscii = require('image-to-ascii')

    if (url[0] === '<' && url[url.length-1] === '>') {
      url = url.slice(1, -1)
    }

    imageToAscii(url, {
      colored: false,
      size: { height: 20 },
      white_bg: false,
    }, (err, converted) => {
      if (err) {
        console.log(err)
        return msg.channel.send('ms')
      }

      msg.channel.send('```\n' + converted + '\n```')
    })
  }
})

client.on('messageReactionAdd', reaction => {
  if (reaction.emoji.name === 'DeletThis' && reaction.count >= 5) {
    return reaction.message.delete()
  }
})

client.on('message', msg => {
  // <value><unit> in/to <unit>
  const regex = /^(-?(?:\d*\.)?\d+)([a-zA-Z]+)\s(?:in|to)\s([a-zA-Z]+)$/
  let r = regex.exec(msg.content)

  if (r == null)
    return

  let [ , value, unitFrom, unitTo ] = r
  value = Number(value)
  unitFrom = unitFrom.toLowerCase()
  unitTo = unitTo.toLowerCase()

  const lengthUnits = [ 'in', 'ft', 'mm', 'cm', 'm', 'km' ]
  if (lengthUnits.includes(unitFrom) && lengthUnits.includes(unitTo)) {
    // imperial/metric length
    const im = require('imperial-metric')

    function st(u) {
      if (u == 'in')
        return 'inch'
      if (u == 'ft')
        return 'foot'

      return u
    }

    let ans = im(value).from(st(unitFrom)).to(st(unitTo))
    return msg.channel.send(`${ans}${unitTo}`)
  }

  const tempUnits = [ 'c', 'f', 'k' ]
  if (tempUnits.includes(unitFrom) && tempUnits.includes(unitTo)) {
    // temperature values
    const t = require('temperature')
    const u = { c: 'Celsius', f: 'Fahrenheit', k: 'Kelvin' }

    if (unitTo === unitFrom)
      return

    let ans = t[u[unitFrom].toLowerCase() + 'To' + u[unitTo]](value)
    return msg.channel.send(`${ans} degrees ${u[unitTo].toLowerCase()}`)
  }
})

client.login(config.bot.token)
