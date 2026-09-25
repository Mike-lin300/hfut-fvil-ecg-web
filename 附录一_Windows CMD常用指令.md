# Windows CMD 常用指令速查手册

> 使用方式：按 `Win + R` 输入 `cmd` 回车，或在开始菜单搜索"命令提示符"打开。

---

## 一、基础操作

| 指令 | 作用 | 示例 |
|------|------|------|
| `help` | 查看所有可用命令 | `help` |
| `help <命令>` | 查看某命令的详细帮助 | `help dir` |
| `命令 /?` | 快速查看命令参数说明 | `ping /?` |
| `cls` | 清空屏幕 | `cls` |
| `exit` | 退出 CMD 窗口 | `exit` |
| `echo` | 输出文本或控制回显 | `echo Hello` |
| `echo.` | 输出一个空行 | `echo.` |
| `pause` | 暂停并等待按键 | `pause` |
| `date` / `time` | 查看/修改系统日期、时间 | `date` |

---

## 二、目录与文件管理

### 目录操作

| 指令 | 作用 | 示例 |
|------|------|------|
| `dir` | 列出当前目录内容 | `dir` |
| `dir /s` | 递归列出子目录内容 | `dir /s C:\Windows` |
| `dir /w` | 宽格式显示 | `dir /w` |
| `cd` | 显示当前目录 | `cd` |
| `cd <路径>` | 切换目录 | `cd D:\project` |
| `cd ..` | 返回上一级目录 | `cd ..` |
| `cd \` | 回到当前盘符根目录 | `cd \` |
| `d:` | 切换到 D 盘 | `d:` |
| `md` / `mkdir` | 创建目录 | `md test` |
| `rd` / `rmdir` | 删除空目录 | `rd test` |
| `rd /s /q` | 递归强制删除目录（含非空，慎用） | `rd /s /q test` |
| `tree` | 以树状图显示目录结构 | `tree /f` |

### 文件操作

| 指令 | 作用 | 示例 |
|------|------|------|
| `type <文件>` | 查看文本文件内容 | `type a.txt` |
| `copy <源> <目标>` | 复制文件 | `copy a.txt b.txt` |
| `xcopy <源> <目标>` | 批量复制文件/目录（可带参数 `/s /e`） | `xcopy /s /e a b` |
| `move <源> <目标>` | 移动文件或目录 | `move a.txt D:\` |
| `ren` / `rename` | 重命名文件 | `ren a.txt b.txt` |
| `del` / `erase` | 删除文件（可用通配符） | `del *.tmp` |
| `del /f /s /q` | 强制递归删除，不询问 | `del /f /s /q *.log` |
| `find` | 在文件中查找字符串 | `find "error" log.txt` |
| `findstr` | 高级查找（支持正则、多文件） | `findstr /i "error" *.txt` |
| `sort` | 对文本内容排序 | `type a.txt \| sort` |
| `fc` | 比较两个文件差异 | `fc a.txt b.txt` |
| `where <程序名>` | 查找程序所在路径 | `where notepad` |

---

## 三、磁盘管理

| 指令 | 作用 | 示例 |
|------|------|------|
| `chkdsk` | 检查磁盘错误 | `chkdsk C:` |
| `chkdsk /f` | 修复磁盘错误（需管理员权限） | `chkdsk C: /f` |
| `diskpart` | 打开磁盘分区工具（管理员） | `diskpart` |
| `format <盘符>` | 格式化磁盘（慎用！会清空数据） | `format D:` |
| `vol` | 显示磁盘卷标和序列号 | `vol C:` |
| `label` | 设置磁盘卷标 | `label D: 数据盘` |
| `wmic logicaldisk` | 查看各磁盘容量信息 | `wmic logicaldisk get name,size,freespace` |

---

## 四、网络命令

| 指令 | 作用 | 示例 |
|------|------|------|
| `ipconfig` | 查看 IP 配置 | `ipconfig` |
| `ipconfig /all` | 查看完整网络信息（含 MAC、DNS） | `ipconfig /all` |
| `ipconfig /flushdns` | 刷新 DNS 缓存 | `ipconfig /flushdns` |
| `ipconfig /release` / `renew` | 释放 / 重新获取 IP | `ipconfig /renew` |
| `ping <地址>` | 测试网络连通性 | `ping www.baidu.com` |
| `ping -t <地址>` | 持续 ping（Ctrl+C 停止） | `ping -t 8.8.8.8` |
| `tracert <地址>` | 追踪路由节点 | `tracert www.baidu.com` |
| `pathping <地址>` | 路由追踪+丢包统计 | `pathping www.baidu.com` |
| `netstat -an` | 查看所有端口连接 | `netstat -an` |
| `netstat -ano` | 查看端口占用及对应 PID | `netstat -ano` |
| `nslookup <域名>` | 查询 DNS 解析 | `nslookup www.baidu.com` |
| `arp -a` | 查看 ARP 缓存表 | `arp -a` |
| `route print` | 查看路由表 | `route print` |
| `telnet <地址> <端口>` | 测试端口连通性 | `telnet 192.168.1.1 80` |
| `netsh` | 网络配置命令行工具 | `netsh wlan show profiles` |

---

## 五、系统信息

| 指令 | 作用 | 示例 |
|------|------|------|
| `systeminfo` | 查看系统详细信息 | `systeminfo` |
| `ver` | 查看 Windows 版本 | `ver` |
| `hostname` | 查看计算机名 | `hostname` |
| `whoami` | 查看当前用户 | `whoami` |
| `whoami /priv` | 查看当前用户权限 | `whoami /priv` |
| `set` | 查看所有环境变量 | `set` |
| `set <变量>=<值>` | 设置环境变量（仅当前窗口） | `set PATH=%PATH%;D:\tools` |
| `echo %变量%` | 输出环境变量值 | `echo %PATH%` |
| `winver` | 打开系统版本窗口 | `winver` |
| `dxdiag` | 打开 DirectX 诊断工具 | `dxdiag` |

---

## 六、进程与任务管理

| 指令 | 作用 | 示例 |
|------|------|------|
| `tasklist` | 查看所有运行中的进程 | `tasklist` |
| `tasklist \| findstr <名称>` | 按名称筛选进程 | `tasklist \| findstr chrome` |
| `taskkill /pid <PID>` | 按 PID 结束进程 | `taskkill /pid 1234` |
| `taskkill /f /pid <PID>` | 强制结束进程 | `taskkill /f /pid 1234` |
| `taskkill /im <进程名>` | 按进程名结束（可加 `/f`） | `taskkill /im notepad.exe` |
| `start <程序/命令>` | 启动程序或新窗口 | `start notepad` |
| `wmic process` | 查看进程详细信息（含内存占用） | `wmic process where name="chrome.exe" get processid,workingsetsize` |

---

## 七、服务管理（需管理员权限）

| 指令 | 作用 | 示例 |
|------|------|------|
| `net start` | 查看已启动的服务 | `net start` |
| `net start <服务名>` | 启动服务 | `net start spooler` |
| `net stop <服务名>` | 停止服务 | `net stop spooler` |
| `sc query <服务名>` | 查询服务状态 | `sc query spooler` |
| `sc config <服务名> start= auto` | 设置服务开机自启 | `sc config spooler start= auto` |
| `sc stop` / `sc start` | 停止 / 启动服务 | `sc stop spooler` |

---

## 八、用户与账户管理（需管理员权限）

| 指令 | 作用 | 示例 |
|------|------|------|
| `net user` | 查看所有用户账户 | `net user` |
| `net user <用户名>` | 查看指定用户信息 | `net user admin` |
| `net user <用户名> <密码> /add` | 创建新用户 | `net user test 123456 /add` |
| `net user <用户名> /delete` | 删除用户 | `net user test /delete` |
| `net localgroup administrators <用户名> /add` | 将用户加入管理员组 | `net localgroup administrators test /add` |

---

## 九、其他实用指令

| 指令 | 作用 | 示例 |
|------|------|------|
| `shutdown /s /t 0` | 立即关机 | `shutdown /s /t 0` |
| `shutdown /r /t 0` | 立即重启 | `shutdown /r /t 0` |
| `shutdown /s /t 3600` | 1 小时后关机 | `shutdown /s /t 3600` |
| `shutdown /a` | 取消关机计划 | `shutdown /a` |
| `taskmgr` | 打开任务管理器 | `taskmgr` |
| `msconfig` | 打开系统配置 | `msconfig` |
| `control` | 打开控制面板 | `control` |
| `notepad` | 打开记事本 | `notepad` |
| `calc` | 打开计算器 | `calc` |
| `mspaint` | 打开画图 | `mspaint` |
| `regedit` | 打开注册表编辑器 | `regedit` |
| `gpedit.msc` | 打开组策略编辑器（专业版/企业版） | `gpedit.msc` |
| `services.msc` | 打开服务管理器 | `services.msc` |
| `devmgmt.msc` | 打开设备管理器 | `devmgmt.msc` |
| `compmgmt.msc` | 打开计算机管理 | `compmgmt.msc` |
| `diskmgmt.msc` | 打开磁盘管理 | `diskmgmt.msc` |
| `cleanmgr` | 打开磁盘清理 | `cleanmgr` |
| `sfc /scannow` | 系统文件检查并修复（管理员） | `sfc /scannow` |
| `DISM /Online /Cleanup-Image /RestoreHealth` | 修复系统映像（管理员） | `DISM /Online /Cleanup-Image /RestoreHealth` |

---

## 十、常用符号与技巧

| 符号 | 含义 | 示例 |
|------|------|------|
| `*` | 通配符（匹配任意字符） | `del *.tmp` |
| `?` | 通配符（匹配单个字符） | `dir a?.txt` |
| `\|` | 管道（把前命令输出传给后命令） | `tasklist \| findstr chrome` |
| `>` | 输出重定向（覆盖写入文件） | `ipconfig > ip.txt` |
| `>>` | 输出重定向（追加写入文件） | `echo test >> log.txt` |
| `&` | 顺序执行多个命令 | `cd /d D:\ && dir` |
| `&&` | 前命令成功后才执行后命令 | `ping www.baidu.com && echo 通` |
| `||` | 前命令失败才执行后命令 | `ping www.baidu.com \|\| echo 不通` |
| `^` | 转义符 | `echo ^|` |

---

## 常用组合场景速查

- **查看端口被哪个进程占用**：`netstat -ano | findstr 8080` → 记下 PID → `tasklist | findstr <PID>` 或 `taskkill /f /pid <PID>`
- **快速清空某个文件夹**：`del /f /s /q C:\temp\* && rd /s /q C:\temp`
- **批量重命名文件**：`ren *.txt *.md`
- **查看 Wi-Fi 密码**：`netsh wlan show profile <名称> key=clear`
- **复制整个目录（含子目录和空目录）**：`xcopy /s /e /i D:\a C:\b`

---

> ⚠️ 注意：`format`、`rd /s /q`、`del /f /s /q`、`diskpart`、`regedit` 等命令可能造成数据丢失或系统损坏，使用前请确认操作对象，重要数据先备份。部分命令需要以管理员身份运行 CMD 才有效。
