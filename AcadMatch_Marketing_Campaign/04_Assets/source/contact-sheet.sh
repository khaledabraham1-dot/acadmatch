# Planche contact : images clés d'une vidéo, côte à côte (relecture de la direction artistique).
# Usage : bash sheet.sh <video.mp4> <sortie.png> t1 t2 t3 ...
FF=$(python -c "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())")
in=$1; out=$2; shift 2
args=(); filt=""; i=0
for t in "$@"; do args+=(-ss "$t" -i "$in"); filt+="[$i:v]scale=360:-1,drawtext=text='${t}s':x=12:y=12:fontsize=28:fontcolor=white:box=1:boxcolor=black@0.5[v$i];"; i=$((i+1)); done
inputs=""; for ((j=0;j<i;j++)); do inputs+="[v$j]"; done
"$FF" -y -loglevel error "${args[@]}" -filter_complex "${filt}${inputs}hstack=inputs=$i" -frames:v 1 "$out"
