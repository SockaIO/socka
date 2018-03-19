#!/usr/bin/env/python

"""
Generate a REST API for the Songs
"""

import errno
import json
import os
import sys

class ApiGen(object):

    def __init__(self, folder, prefix):
        self.packs = set()
        self.packSongs = {}
        self.prefix = prefix
        self.folder = folder


    def gen_api(self):
        """ Do Generate the API """
        for root, packs, files in os.walk(self.folder):
            relativeRoot = root[len(self.folder):]
            path = relativeRoot.split(os.sep)

            if len(path) < 2 or len(files) == 0:
                continue

            pack = path[len(path) - 2]
            song = path[len(path) - 1]

            self.parse_song(pack, song, files, path)


    def parse_song(self, pack, song_name, files, path):
        """ Generate the Json files for a song """

        self.packs.add(pack)

        if not pack in self.packSongs:
            self.packSongs[pack] = {}

        song = {
                "name": song_name
        }

        IMG_EXTS = ['.jpg', '.png']
        AUDIO_EXTS = ['.mp3', '.ogg']
        CHART_EXTS = ['.dwi', '.sm', '.ssc']

        for f in files:
            filename, extension = os.path.splitext(f)

            if extension in IMG_EXTS and 'bg' in filename:
                song["background"] = self.build_uri(path, f)

            if extension in IMG_EXTS and 'bn' in filename:
                song["banner"] = self.build_uri(path, f)

            if (extension in IMG_EXTS and
                   not ('bn' in filename or 'bg' in filename) and
                   not "banner" in song):

                song["banner"] = self.build_uri(path, f)

            if extension in AUDIO_EXTS:
                song["audio"] = self.build_uri(path, f)

            if extension in CHART_EXTS:
                song["chart"] = self.build_uri(path, f)

        if not "chart" in song or not "audio" in song:
            return

        self.packSongs[pack][song_name] = song

    def dump(self):

        packs = []
        for p in self.packs:
            packs.append({
                "name": p
            })

        packs = sorted(packs, key=lambda x: x["name"])

        # Create the packs.json Endpoints
        with open(os.path.join(self.folder, "packs.json"), "w") as output:
            json.dump(packs, output)

        # Create the packs Folder
        try:
            os.mkdir(os.path.join(self.folder, "packs"))
        except OSError as exc:
            if exc.errno != errno.EEXIST:
                raise
            pass

        # Create the Endpoints JSON Files
        for pack, songs in self.packSongs.items():

            sorted_songs = sorted(songs.values(), key=lambda x: x["name"])

            filename = os.path.join(self.folder, "packs", pack + ".json")
            with open(filename, "w") as output:
                json.dump(sorted_songs, output)

    def build_uri(self, path, filename):
        return self.prefix + "/" + "/".join(path) + "/" + filename


def main():
    """ Generate the API """
    prefix = ""

    if len(sys.argv) == 1:
        print("Usage: gen_api.py [Directory] [Url Prefix (optional)]")
        return

    target = sys.argv[1]

    if len(sys.argv) > 2:
        prefix = sys.argv[2]

    generator = ApiGen(target, prefix)
    generator.gen_api()
    generator.dump()

if __name__ == '__main__':
    main()
