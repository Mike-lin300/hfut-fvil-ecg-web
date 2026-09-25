#include "Ano_FlightCtrl.h"
#include "Ano_RC.h"
#include "Ano_ProgramCtrl_User.h"
#include "Ano_OF.h"
#include "ZXH_Land.h"
#include "ZXH_FlightCtrl.h"
#include "ZXH_TakeOff.h"
#include "ZXH_SendData.h"
#include "LZY_TaskManager.h"
#include "LZY_DT.h"
#include "LZY_RPLidar.h"
#include "LZY_LoRa.h"
#include "Drv_OpenMV.h"

unsigned char SFlag = 1;
uint16_t ZGS_tm = 0;
uint16_t ZGS_tm1 = 0;
unsigned int TaskTimer_ms = 0;
unsigned int TaskConfirmCount = 0;
unsigned char OrdinalNum = 0;
u8 ModeChangedFlag = 0;
// unsigned int USART2_TaskTimer_ms = 0;

// u8 userCnt = 0;

/*
函数名:ZGS_FlightCtrlTask
参数:dT_ms
返回值:无
作用:一键飞行任务
*/
void ZXH_FlightCtrlTask(unsigned char dT_ms)
{
	ZXH_DataSand(jsdata.valid_of_alt_cm);
	LZY_DataSand_F4(rplidar_st.x, rplidar_st.y,rplidar_st.yaw, rplidar_st.iflag);
	ZGS_tm1 = TaskTimer_ms/100;
	ZXH_DataSand2(ZGS_tm1);
	// if (userCnt++ == 0) LoRa_Send(lora_st.c1, lora_st.c2, lora_st.c3);
	
	if (flag.unlock_sta == 1)		
	{		
		Remote_Control(dT_ms);
		ZXH_AutoLand(dT_ms);
		// 正常定高
		if (KHFlag == 1 && LandProgramUnlock_sta == 0)
		{
			KeepHeight(OFF_CM);
		}
		
	  	switch(OrdinalNum)
		{
			case 0: 	// 一键起飞
			{			
				if (SFlag == 1)
				{
					SFlag = 0;
					TaskConfirmCount = 0;
				}
				
				ZXH_AutoTakeOff(dT_ms);		
				LZY_DataSand_F3(0x00);
				if(ABS(OFF_CM - RELATIVE_HEIGHT_CM) <= 5){
					ZGS_tm ++;
				}else {
					ZGS_tm = 0;
				}

				if (KHFlag == 1 && ZGS_tm>20)
				{
					if (TaskConfirmCount <= 10)
					{
						if(ABS(OFF_CM - RELATIVE_HEIGHT_CM) <= 5){
						TaskConfirmCount ++;
						}else {
							TaskConfirmCount = 0;
						}
					}
					else
					{
						TaskConfirmCount = 0;
						TaskTimer_ms = 0;					
						SFlag = 1;
						
						OrdinalNum++;						
					}
				}
			}break;
			case 1:		// 短悬停
			{
				if (SFlag == 1)
				{
					SFlag = 0;
					TaskTimer_ms = 0;
				}
				LZY_DataSand_F3(0x01);
				if (TaskTimer_ms <= 5000)
				{
					if (rplidar_st.iflag) {
						LZY_Scheduler(TASK_MODE_POSITION_CTRL, 0, 0, 0, 0.02, &ModeChangedFlag);
					}
					TaskTimer_ms += dT_ms;
				}
				else
				{
					TaskTimer_ms = 0;
					OrdinalNum++;
				}
			}break;
			case 2:
			{
				if (SFlag == 1)
				{
					ModeChangedFlag = 1;
					SFlag = 0;
					TaskTimer_ms = 0;
					TaskConfirmCount = 0;
				}
				LZY_DataSand_F3(0x02);
				if (rplidar_st.iflag) {
					LZY_Scheduler(TASK_MODE_POSITION_CTRL, 150, 0, 0, 0.02, &ModeChangedFlag);
				}
				else {
					LZY_Scheduler(TASK_MODE_VELOCITY_HOVER, 0, 0, 0, 0.02, &ModeChangedFlag);
				}

				if (InRange(150, 0, 8)) {
					TaskConfirmCount++;
					OFF_CM = 100;
				}
				else {
					TaskConfirmCount = 0;
				}

				if (TaskConfirmCount >= 200)
				{
					TaskTimer_ms = 0;
					TaskConfirmCount = 0;
					ModeChangedFlag = 1;
					OrdinalNum++;
				}
			}break;
			case 3:
			{
				if (SFlag == 1)
				{
					ModeChangedFlag = 1;
					SFlag = 0;
					TaskTimer_ms = 0;
					TaskConfirmCount = 0;
				}
				LZY_DataSand_F3(0x03);
				if (rplidar_st.iflag) {
					LZY_Scheduler(TASK_MODE_POSITION_CTRL, 150, 150, 0, 0.02, &ModeChangedFlag);
				}
				else {
					LZY_Scheduler(TASK_MODE_VELOCITY_HOVER, 0, 0, 0, 0.02, &ModeChangedFlag);
				}

				if (InRange(150, 150, 8)) {
					TaskConfirmCount++;
					OFF_CM = 150;
				}
				else {
					TaskConfirmCount = 0;
				}

				if (TaskConfirmCount >= 200)
				{
					TaskTimer_ms = 0;
					TaskConfirmCount = 0;
					ModeChangedFlag = 1;
					OrdinalNum++;
				}
			}break;
			case 4:
			{
				if (SFlag == 1)
				{
					ModeChangedFlag = 1;
					SFlag = 0;
					TaskTimer_ms = 0;
					TaskConfirmCount = 0;
				}
				LZY_DataSand_F3(0x04);
				if (rplidar_st.iflag) {
					LZY_Scheduler(TASK_MODE_POSITION_CTRL, 0, 150, 0, 0.02, &ModeChangedFlag);
				}
				else {
					LZY_Scheduler(TASK_MODE_VELOCITY_HOVER, 0, 0, 0, 0.02, &ModeChangedFlag);
				}

				if (InRange(0, 150, 8)) {
					TaskConfirmCount++;
				}
				else {
					TaskConfirmCount = 0;
				}

				if (TaskConfirmCount >= 100)
				{
					TaskTimer_ms = 0;
					TaskConfirmCount = 0;
					ModeChangedFlag = 1;
					OrdinalNum++;
				}
			}break;
			case 5:
			{
				if (SFlag == 1)
				{
					ModeChangedFlag = 1;
					SFlag = 0;
					TaskTimer_ms = 0;
					TaskConfirmCount = 0;
				}
				LZY_DataSand_F3(0x05);
				if (rplidar_st.iflag) {
					LZY_Scheduler(TASK_MODE_POSITION_CTRL, 0, 0, 0, 0.02, &ModeChangedFlag);
				}
				else {
					LZY_Scheduler(TASK_MODE_VELOCITY_HOVER, 0, 0, 0, 0.02, &ModeChangedFlag);
				}

				if (InRange(0, 0, 8)) {
					TaskConfirmCount++;
				}
				else {
					TaskConfirmCount = 0;
				}

				if (TaskConfirmCount >= 100)
				{
					TaskTimer_ms = 0;
					TaskConfirmCount = 0;
					OrdinalNum = 99;
				}
			}break;

			case 99:	// 降落
			{
				LZY_DataSand_F3(0x63);
				LandProgramUnlock_sta = 1;
				ZXH_Land = Yes; 
			}break;
		}	
	}
}
