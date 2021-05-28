# 数据集生成说明
数据集 `dataset` 的目录结构如下
- dataset 
  - scripts 生成数据集的脚本
    - dashing.sh 生成一个dash视频，指定源文件，tile，gop
    - preprocess.sh 将ERP视频转换为CMP视频
    - iteraton_dashing.sh 循环生成dash视频，记录文件大小
  - notebooks 分析数据的jupyter notebook文件
  - python_cgi cgi模块，处理浏览器发来的数据，并在服务器记录
  - dashed 存放生成的dash视频
  - preprocess 预处理视频，存放CMP视频
  - raw-mp4 存放原始ERP视频
  - viewer_data 用户视角数据
    - viewerData.json 处理后的视角数据，可由`视角数据集预处理.ipynb`生成
  - segment_size 存放`iteraton_dashing.sh`记录的文件大小

## 脚本使用
1. 确认脚本中的输入参数
2. 注意使用时要在`dataset`目录下运行脚本，如
    ```
    cd dataset
    script/preprocess.sh
    script/dashing.sh
    ```