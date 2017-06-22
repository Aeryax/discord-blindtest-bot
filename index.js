/* eslint no-console: 0 */
'use strict';

const Discord = require('discord.js');
const ytdl = require('ytdl-core');

const client = new Discord.Client({ fetchAllMembers: false, apiRequestMethod: 'sequential' });

const auth = require('./auth.json');

client.login(auth.token).then(() => console.log('logged')).catch(console.error);

const connections = new Map();

let leaderboard = [];

let broadcast;
let score;

client.on('message', m => {
  if (!m.guild) return;
  console.log(`message : ${m.content}`);
  if (m.content.startsWith('!join') && m.author.id === '180356231452426240') {
    const channel = m.guild.channels.get(m.content.split(' ')[1]) || m.member.voiceChannel;
    if (channel && channel.type === 'voice') {
      channel.join().then(conn => {
        conn.player.on('error', (...e) => console.log('player', ...e));
        if (!connections.has(m.guild.id)) connections.set(m.guild.id, { conn, queue: [] });
        m.reply('ok!');
      });
    } else {
      m.reply('Specify a voice channel!');
    }
  } else if (m.content.startsWith('!add') && m.author.id === '180356231452426240') {
    if (connections.has(m.guild.id)) {
      const connData = connections.get(m.guild.id);
      const queue = connData.queue;
      const url = m.content.split(' ').slice(1)[0]
        .replace(/</g, '')
        .replace(/>/g, '');
      const answer = m.content.split(' ').slice(2).join(' ');
        
      queue.push({ url, answer });
      m.reply(`${queue.length} songs`);
      return;
      //doQueue(connData);
    }
  } /*else if (m.content.startsWith('/skip')) {
    if (connections.has(m.guild.id)) {
      const connData = connections.get(m.guild.id);
      if (connData.dispatcher) {
        connData.dispatcher.end();
      }
    }
  } */else if (m.content.startsWith('!start') && m.author.id === '180356231452426240') {
    if (connections.has(m.guild.id)) {
      const connData = connections.get(m.guild.id);
      doQueue(connData);
    }
  } else if (m.content.startsWith('!win') && m.author.id === '180356231452426240') {
    if(broadcast !== undefined) {
      let sort = leaderboard.sort((element1, element2) => {
        if (element1.score < element2.score) {
          return -1;
        }
        if (element1.score > element2.score) {
          return 1;
        }
        return 0;
      });
  
      let message = 'This is the end...\n Congrats all!\n Thanks for playing!\n';
      sort.forEach((element) => {
        message += `${element.user.username} | ${element.score}\n`;
      });
      m.channel.sendMessage(message);
    }
    else {
      m.reply(`Please wait the end of the current song!`);
    }
    
  } else if (m.content.startsWith('!score') && m.author.id === '180356231452426240') {
    let sort = leaderboard.sort((element1, element2) => {
      if (element1.score < element2.score) {
        return -1;
      }
      if (element1.score > element2.score) {
        return 1;
      }
      return 0;
    });

    let message = '';

    let rank = 1;
    
    sort.forEach((element) => {
      message += `${rank++} | ${element.user.username} | ${element.score}\n`;
    });
    m.reply(message);
  } else {
    if (broadcast !== undefined && m.content === broadcast.answer) {
      let find = leaderboard.find((element) => {
        return m.author.id === element.user.id;
      });

      if (find && find.length > 0) {
        let element = find[0];
        if (score > 0) {
          element.score += score;
          score -= 15;
        }
      }
      else {
        leaderboard.push({
          user: m.author,
          score: score
        });
        if (score > 0) {
          score -= 15;
        }
      }
    }
  }
});

function doQueue(connData) {
  const conn = connData.conn;
  const queue = connData.queue;
  const item = queue[0];
  if (!item) return;
  const stream = ytdl(item.url, { filter: 'audioonly' }, { passes: 3 });
  const dispatcher = conn.playStream(stream);
  stream.on('info', info => {
    broadcast = item;
    score = 90;
    //item.m.reply(`OK, playing **${info.title}**`);
  });
  dispatcher.on('end', () => {
    queue.shift();
    broadcast = undefined;
    //doQueue(connData);
  });
  dispatcher.on('error', (...e) => console.log('dispatcher', ...e));
  connData.dispatcher = dispatcher;
}