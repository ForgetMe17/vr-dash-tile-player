# set src video
ERP_VIDEO="raw-mp4/1-2-Front-180s.mp4"
V_WIDTH=2560
V_HEIGHT=1440

# preprocessed base dir
BASE_DIR="preprocess/$(basename $ERP_VIDEO .mp4)"
if [ -d $BASE_DIR ];then
    echo "Exists $BASE_DIR"
    exit 0
fi

##### start preprocess
mkdir -p $BASE_DIR/raw_mp4
mkdir -p $BASE_DIR/face0
mkdir -p $BASE_DIR/face1
mkdir -p $BASE_DIR/face2
mkdir -p $BASE_DIR/face3
mkdir -p $BASE_DIR/face4
mkdir -p $BASE_DIR/face5

# cmp video out path
CMP_VIDEO="$BASE_DIR/raw_mp4/$(basename $ERP_VIDEO .mp4)-CMP.mp4"

# convert erp to cmp
echo "Converting erp to cmp"
ffmpeg -i $ERP_VIDEO -vf v360=e:c3x2:cubic:w=$V_WIDTH:h=$V_HEIGHT:out_pad=0 \
-c:v h264_nvenc -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $CMP_VIDEO -loglevel quiet

# cut into 6 faces
echo "Cutting face 0"
ffmpeg -y -i $CMP_VIDEO -vf "crop=w=in_w/3:h=in_h/2:x=0*(in_w/3):y=0*(in_h/2)" \
-c:v h264_nvenc -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face0/face0.mp4 -loglevel quiet

echo "Cutting face 1"
ffmpeg -y -i $CMP_VIDEO -vf "crop=w=in_w/3:h=in_h/2:x=1*(in_w/3):y=0*(in_h/2)" \
-c:v h264_nvenc -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face1/face1.mp4 -loglevel quiet

echo "Cutting face 2"
ffmpeg -y -i $CMP_VIDEO -vf "crop=w=in_w/3:h=in_h/2:x=2*(in_w/3):y=0*(in_h/2)" \
-c:v h264_nvenc -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face2/face2.mp4 -loglevel quiet

echo "Cutting face 3"
ffmpeg -y -i $CMP_VIDEO -vf "crop=w=in_w/3:h=in_h/2:x=0*(in_w/3):y=1*(in_h/2)" \
-c:v h264_nvenc -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face3/face3.mp4 -loglevel quiet

echo "Cutting face 4"
ffmpeg -y -i $CMP_VIDEO -vf "crop=w=in_w/3:h=in_h/2:x=1*(in_w/3):y=1*(in_h/2)" \
-c:v h264_nvenc -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face4/face4.mp4 -loglevel quiet

echo "Cutting face 5"
ffmpeg.exe -y -i $CMP_VIDEO -vf "crop=w=in_w/3:h=in_h/2:x=2*(in_w/3):y=1*(in_h/2)" \
-c:v h264_nvenc -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face5/face5.mp4 -loglevel quiet

# # muti bitrate version
# echo "Encoding face 0 at crf 60"
# ffmpeg -i $BASE_DIR/face0/face0.mp4 -c:v libvpx-vp9 -crf 60 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face0/face0_60.mp4 -loglevel quiet
# echo "Encoding face 0 at crf 40"
# ffmpeg -i $BASE_DIR/face0/face0.mp4 -c:v libvpx-vp9 -crf 40 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face0/face0_40.mp4 -loglevel quiet
# echo "Encoding face 0 at crf 20"
# ffmpeg -i $BASE_DIR/face0/face0.mp4 -c:v libvpx-vp9 -crf 20 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face0/face0_20.mp4 -loglevel quiet
# echo "Encoding face 0 at crf 0"
# ffmpeg -i $BASE_DIR/face0/face0.mp4 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face0/face0_0.mp4 -loglevel quiet

# echo "Encoding face 1 at crf 60"
# ffmpeg -i $BASE_DIR/face1/face1.mp4 -c:v libvpx-vp9 -crf 60 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face1/face1_60.mp4 -loglevel quiet
# echo "Encoding face 1 at crf 40"
# ffmpeg -i $BASE_DIR/face1/face1.mp4 -c:v libvpx-vp9 -crf 40 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face1/face1_40.mp4 -loglevel quiet
# echo "Encoding face 1 at crf 20"
# ffmpeg -i $BASE_DIR/face1/face1.mp4 -c:v libvpx-vp9 -crf 20 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face1/face1_20.mp4 -loglevel quiet
# echo "Encoding face 1 at crf 0"
# ffmpeg -i $BASE_DIR/face1/face1.mp4 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face1/face1_0.mp4 -loglevel quiet

# echo "Encoding face 2 at crf 60"
# ffmpeg -i $BASE_DIR/face2/face2.mp4 -c:v libvpx-vp9 -crf 60 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face2/face2_60.mp4 -loglevel quiet
# echo "Encoding face 2 at crf 40"
# ffmpeg -i $BASE_DIR/face2/face2.mp4 -c:v libvpx-vp9 -crf 40 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face2/face2_40.mp4 -loglevel quiet
# echo "Encoding face 2 at crf 20"
# ffmpeg -i $BASE_DIR/face2/face2.mp4 -c:v libvpx-vp9 -crf 20 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face2/face2_20.mp4 -loglevel quiet
# echo "Encoding face 2 at crf 0"
# ffmpeg -i $BASE_DIR/face2/face2.mp4 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face2/face2_0.mp4 -loglevel quiet

# echo "Encoding face 3 at crf 60"
# ffmpeg -i $BASE_DIR/face3/face3.mp4 -c:v libvpx-vp9 -crf 60 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face3/face3_60.mp4 -loglevel quiet
# echo "Encoding face 3 at crf 40"
# ffmpeg -i $BASE_DIR/face3/face3.mp4 -c:v libvpx-vp9 -crf 40 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face3/face3_40.mp4 -loglevel quiet
# echo "Encoding face 3 at crf 20"
# ffmpeg -i $BASE_DIR/face3/face3.mp4 -c:v libvpx-vp9 -crf 20 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face3/face3_20.mp4 -loglevel quiet
# echo "Encoding face 3 at crf 0"
# ffmpeg -i $BASE_DIR/face3/face3.mp4 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face3/face3_0.mp4 -loglevel quiet

# echo "Encoding face 4 at crf 60"
# ffmpeg -i $BASE_DIR/face4/face4.mp4 -c:v libvpx-vp9 -crf 60 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face4/face4_60.mp4 -loglevel quiet
# echo "Encoding face 4 at crf 40"
# ffmpeg -i $BASE_DIR/face4/face4.mp4 -c:v libvpx-vp9 -crf 40 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face4/face4_40.mp4 -loglevel quiet
# echo "Encoding face 4 at crf 20"
# ffmpeg -i $BASE_DIR/face4/face4.mp4 -c:v libvpx-vp9 -crf 20 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face4/face4_20.mp4 -loglevel quiet
# echo "Encoding face 4 at crf 0"
# ffmpeg -i $BASE_DIR/face4/face4.mp4 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face4/face4_0.mp4 -loglevel quiet

# echo "Encoding face 5 at crf 60"
# ffmpeg -i $BASE_DIR/face5/face5.mp4 -c:v libvpx-vp9 -crf 60 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face5/face5_60.mp4 -loglevel quiet
# echo "Encoding face 5 at crf 40"
# ffmpeg -i $BASE_DIR/face5/face5.mp4 -c:v libvpx-vp9 -crf 40 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face5/face5_40.mp4 -loglevel quiet
# echo "Encoding face 5 at crf 20"
# ffmpeg -i $BASE_DIR/face5/face5.mp4 -c:v libvpx-vp9 -crf 20 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face5/face5_20.mp4 -loglevel quiet
# echo "Encoding face 5 at crf 0"
# ffmpeg -i $BASE_DIR/face5/face5.mp4 -c:v libvpx-vp9 -crf 0 -b:v 0 -keyint_min 30 -g 30 -sc_threshold 0 -an $BASE_DIR/face5/face5_0.mp4 -loglevel quiet
