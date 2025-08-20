import Imap from 'node-imap';
import { simpleParser } from 'mailparser';
import dotenv from 'dotenv';
dotenv.config();

const imapConfig = {
  user: process.env.GMAIL_IMAP_USER, // your Gmail address
  password: process.env.GMAIL_IMAP_PASS, // your App Password
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
};

export function fetchLatestEmails({ mailbox = 'INBOX', max = 5 } = {}) {
  return new Promise((resolve, reject) => {
    const imap = new Imap(imapConfig);
    let results = [];

    function openInbox(cb) {
      imap.openBox(mailbox, true, cb);
    }

    imap.once('ready', function () {
      openInbox(function (err, box) {
        if (err) return reject(err);
        const fetchOptions = {
          bodies: '',
          markSeen: false,
        };
        // Fetch the last N messages
        const seq = box.messages.total > max ? `${box.messages.total - max + 1}:*` : '1:*';
        const f = imap.seq.fetch(seq, fetchOptions);
        f.on('message', function (msg, seqno) {
          let buffer = '';
          msg.on('body', function (stream) {
            stream.on('data', function (chunk) {
              buffer += chunk.toString('utf8');
            });
          });
          msg.once('end', async function () {
            try {
              const parsed = await simpleParser(buffer);
              results.push(parsed);
            } catch (e) {
              // skip parse errors
            }
          });
        });
        f.once('error', function (err) {
          reject(err);
        });
        f.once('end', function () {
          imap.end();
        });
      });
    });

    imap.once('error', function (err) {
      reject(err);
    });

    imap.once('end', function () {
      resolve(results);
    });

    imap.connect();
  });
}


