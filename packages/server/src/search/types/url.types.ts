export const urlRegex =
  /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)/;

export const streamUrlRegex = {
  Youtube: /^(https?:\/\/)?((www\.)?youtube\.com|youtu\.be)\/.+$/,
  Spotify: /^(https?:\/\/)?((www\.)?open\.spotify\.com)\/.+$/,
  SoundCloud: /^(https?:\/\/)?((www\.)?soundcloud\.com)\/.+$/,
} as const;
