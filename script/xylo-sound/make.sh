#!/bin/sh

chuck --silent xylo.ck && lame -V 9 xylo.wav && rm xylo.wav && mv xylo.mp3 ../../app/assets/audio/
