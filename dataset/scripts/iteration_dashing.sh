funcDashingOneParam(){
    # set src video
    # $1 gop
    # $2 tile_row
    ERP_VIDEO="raw-mp4/1-2-Front-180s.mp4"
    GOP=$1
    START_TIME=0
    DURATION=30
    DASH_LEN=`expr $GOP \* 33`
    TILE_ROW=$2
    TILE_COL=$2

    # preprocessed base dir
    BASE_DIR="preprocess/$(basename $ERP_VIDEO .mp4)"
    DASH_DIR="dashed/$(basename $ERP_VIDEO .mp4)-tile_$TILE_ROW-gop_$GOP-temp"
    DASH_DIRNAME="$(basename $ERP_VIDEO .mp4)-tile_$TILE_ROW-gop_$GOP-temp"

    funcEncodingFace(){
        # $1 number of face
        for tile_row in $(seq 0  `expr $TILE_ROW - 1`)
        do
            for tile_col in $(seq 0 `expr $TILE_COL - 1`)
            do
                tile_idx=`expr $tile_row \* $TILE_COL`
                tile_idx=`expr $tile_idx + $tile_col`
                mkdir -p $DASH_DIR/face$1/tile$tile_idx
                echo "Encoding face $1 tile $tile_idx-($tile_row,  $tile_col) at cq 40"
                ffmpeg -y -i $BASE_DIR/face$1/face$1.mp4 \
                -vf "crop=w=in_w/$TILE_COL:h=in_h/$TILE_ROW:x=$tile_col*(in_w/$TILE_COL):y=$tile_row*(in_h/$TILE_ROW)" \
                -ss $START_TIME -t $DURATION \
                -c:v h264 -crf 40 -b:v 0 -keyint_min $GOP -g $GOP -sc_threshold 0 \
                -an $DASH_DIR/face$1/tile$tile_idx/face$1_40.mp4 \
                -loglevel quiet

                echo "Encoding face $1 tile $tile_idx-($tile_row,  $tile_col) at cq 1"
                ffmpeg -y -i $BASE_DIR/face$1/face$1.mp4 \
                -vf "crop=w=in_w/$TILE_COL:h=in_h/$TILE_ROW:x=$tile_col*(in_w/$TILE_COL):y=$tile_row*(in_h/$TILE_ROW)" \
                -ss $START_TIME -t $DURATION \
                -c:v h264 -crf 0 -b:v 0 -keyint_min $GOP -g $GOP -sc_threshold 0 \
                -an $DASH_DIR/face$1/tile$tile_idx/face$1_1.mp4 \
                -loglevel quiet
                
                funcDashingFace $1 $tile_idx
            done
        done
    }

    funcDashingFace(){
        # $1 number of face
        # $2 tile index
        echo "Fragmenting face $1 at cq 40"
        mp4fragment.exe --fragment-duration $DASH_LEN $DASH_DIR/face$1/tile$2/face$1_40.mp4 $DASH_DIR/face$1/tile$2/f_face$1_40.mp4

        echo "Fragmenting face $1 at cq 1"
        mp4fragment.exe --fragment-duration $DASH_LEN $DASH_DIR/face$1/tile$2/face$1_1.mp4 $DASH_DIR/face$1/tile$2/f_face$1_1.mp4

        echo "Dashing face $1"
        mp4dash.bat --output-dir=$DASH_DIR/face$1/tile$2/dash \
        --mpd-name=stream.mpd \
        $DASH_DIR/face$1/tile$2/f_face$1_1.mp4 \
        $DASH_DIR/face$1/tile$2/f_face$1_40.mp4
    }


    rm -rf $DASH_DIR
    if [ -d $DASH_DIR ];then
        echo "Exists $BASE_DIR"
        exit 0
    fi

    mkdir -p $DASH_DIR/face0
    mkdir -p $DASH_DIR/face1
    mkdir -p $DASH_DIR/face2
    mkdir -p $DASH_DIR/face3
    mkdir -p $DASH_DIR/face4
    mkdir -p $DASH_DIR/face5


    for i in $(seq 0 5) 
    do
        echo "------------------------"
        funcEncodingFace $i
    done

    # autogen json file
    echo "------------------------"
    echo "Generating json and html file"
    python scripts/gen_webcontent.py --gop $GOP --row $TILE_ROW --base_dir $DASH_DIR

    # segment size
    echo "------------------------"
    echo "Getting segment size"
    python scripts/get_segment_size.py --gop $GOP --row $TILE_ROW --base_dirname $DASH_DIRNAME

    rm -rf $DASH_DIR

}

for tile in $(seq 1 3)
do
    for gop in $(seq 1 30)
    do
        funcDashingOneParam $gop $tile
    done
done