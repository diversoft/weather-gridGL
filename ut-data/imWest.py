import pickle as pkl
from subprocess import Popen, PIPE, STDOUT
import numpy as np
import datetime, time, json

def convertifyTemp(rAll):
	rExc = np.where(rAll>1e19)
	rAll = rAll+20
	rAll = np.where(rAll<0,0,np.ceil(rAll/10))
	rAll = np.where(rAll>10,10,rAll)
	rAll[rExc] = 11
	rArr = rAll
	rArr = np.array(rArr,dtype=np.int)[:-2]
	#rArr = ','.join(map(str,list(rArr)))
	return rArr
	
def convertifyRH(rAll):
	rExc = np.where(rAll>1e19)
	rAll = np.floor(rAll/10)
	rAll = np.where(rAll>10,10,rAll)
	rAll[rExc] = 11
	rArr = rAll
	rArr = np.array(rArr,dtype=np.int)[:-2]
	#rArr = ','.join(map(str,list(rArr)))
	return rArr
	
def convertifyWind(rAll):
	rExc = np.where(rAll>1e19)
	rAll = np.floor(rAll/5)
	rAll = np.where(rAll>8,8,rAll)
	rAll[rExc] = 9
	rArr = rAll
	rArr = np.array(rArr,dtype=np.int)[:-2]
	#rArr = ','.join(map(str,list(rArr)))
	return rArr
	
def convertifyPrec(rAll):
	rExc = np.where(rAll>1e18)
	rAll = np.where(rAll<0.1,np.ceil(rAll),np.floor(rAll*4)+1)
	rAll = np.where(rAll>8,8,rAll)
	rAll[rExc] = 9
	rArr = rAll
	rArr = np.array(rArr,dtype=np.int)[:-2]
	return rArr

hei = 1377
wid = 2145
latfile = open('../raw-data/lats.pkl')
lonfile = open('../raw-data/lons.pkl')
lats = pkl.load(latfile)
lons = pkl.load(lonfile)
latfile.close()
lonfile.close()

dt = datetime.datetime.utcnow()
day = dt.strftime('%Y%m%d')
hour = dt.hour
if hour<3 or hour>=21:
	realHour = 21
	fcs = 40
	pfcs = 8
elif hour>=3 and hour<9:
	realHour = 3
	fcs = 46
	pfcs = 11
elif hour>=9 and hour<15:
	realHour = 9
	fcs = 44
	pfcs = 10
elif hour>=15 and hour<21:
	realHour = 15
	fcs = 42
	pfcs = 9
	
hours = [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,39,42,45,48,51,54,57,60,63,66,69]
phours = ['3-9','9-15','15-21','21-27','27-33','33-39','39-45','45-51','51-57','57-63','63-69','69-75']
#rthours = ['00','01','02','03','04','05','06','07','08','09','10','11','12','13','14','15','16','17','18','19','20','21','22','23']
ghei = 1028-463
gwid = 854-167
outVars = ['temp','rh','wind','prec']
#outVars = ['prec']
for outVar in outVars:
	j = 0
	if outVar is not 'prec':
		while j<=fcs:
			tm = time.time()
			hour = hours[j]
			if outVar in ['rh','temp']:
				cmd = 'wgrib2 ../raw-data/ds.temp.bin -match "TMP:surface:'+str(hour)+' hour fcst" -end -inv /dev/null -no_header -bin -'
				p = Popen(cmd, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
				output = p.stdout.read()
				dat = np.frombuffer(output[-wid*hei*4::],dtype=np.float32).reshape(hei,wid)
				dat = (dat-273.15)
				if outVar is 'rh':
					tempDat = dat
					cmd = 'wgrib2 ../raw-data/ds.td.bin -match "DPT:surface:'+str(hour)+' hour fcst" -end -inv /dev/null -no_header -bin -'
					p = Popen(cmd, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
					output = p.stdout.read()
					dewDat = np.frombuffer(output[-wid*hei*4::],dtype=np.float32).reshape(hei,wid)
					dewDat = (dewDat-273.15)
					dat = 100*np.exp((17.625*dewDat)/(243.04+dewDat))/np.exp((17.625*tempDat)/(243.4+tempDat))
				elif outVar is 'temp':
					dat = dat*1.8+32
			elif outVar is 'wind':
				cmd = 'wgrib2 ../raw-data/ds.wspd.bin -match "WIND:surface:'+str(hour)+' hour fcst" -end -inv /dev/null -no_header -bin -'
				p = Popen(cmd, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
				output = p.stdout.read()
				dat = np.frombuffer(output[-wid*hei*4::],dtype=np.float32).reshape(hei,wid)
				dat = (dat*1.852)
				
			if j<1:
				latsout = open('./ut_lats.json','w')
				lonsout = open('./ut_lons.json','w')
				latsout.write('var lats=[')
				lonsout.write('var lons=[')
				rlats = lats[463:1028,167:854]*100
				rlons = lons[463:1028,167:854]*100-36000
				for x in xrange(ghei-1):
					for y in xrange(gwid):
						latsout.write(str(int(rlats[x,y]))+','+str(int(rlats[x+1,y])))
						lonsout.write(str(int(rlons[x,y]))+','+str(int(rlons[x+1,y])))
						if x != ghei-2:
							if y != gwid-1:
								latsout.write(',')
								lonsout.write(',')
							elif y == gwid-1:
								#print 'Output Flat Triangle'
								latsout.write(',')
								lonsout.write(',')
								latsout.write(str(int(rlats[x+1,y]))+','+str(int(rlats[x+1,0])))
								lonsout.write(str(int(rlons[x+1,y]))+','+str(int(rlons[x+1,0])))
								latsout.write(',')
								lonsout.write(',')
						else:
							if y != gwid-1:
								latsout.write(',')
								lonsout.write(',')
				latsout.write('];')
				lonsout.write('];')
				latsout.close()
				lonsout.close()
			#print 'Lets give it a shot'	
			#print alldat.shape

			datout = open('./ut_data-'+str(j)+'-'+outVar+'.json','w')
			print 'Writing ut_data-'+str(j)+'-'+outVar+'.json'
			rdat = dat[463:1028,167:854]
			if (outVar is 'rh'):
				bdat = dewDat[463:1028,167:854]
				rdat[bdat>1e19] = 1e19
			rflat = rcflat = np.ndarray(shape=(ghei-1,gwid+1))
			rflat[:,:-1] = rdat[:-1,:]
			rcflat[:,:-1] = rdat[1:,:]
			rflat[:,-1] = rcflat[:,-1] = 1e20
			mergerow = np.array([rflat.flatten(),rcflat.flatten()]).flatten('F')
			if outVar is 'temp':
				outstr = convertifyTemp(mergerow)
			elif outVar is 'rh':
				outstr = convertifyRH(mergerow)
			elif outVar is 'wind':
				outstr = convertifyWind(mergerow)
			sj = json.dumps({'a':outstr.tolist()},separators=(',',':'))
			datout.write(sj)
			datout.close()
			print time.time() - tm
			j+=1
	else:
		while j<=pfcs:
			tm = time.time()
			hour = phours[j]
			cmd = 'wgrib2 ../raw-data/ds.qpf.bin -match "APCP:surface:'+hour+' hour acc fcst" -end -inv /dev/null -no_header -bin -'
			#print cmd
			p = Popen(cmd, shell=True, stdin=PIPE, stdout=PIPE, stderr=STDOUT, close_fds=True)
			output = p.stdout.read()
			dat = np.frombuffer(output[-wid*hei*4::],dtype=np.float32).reshape(hei,wid)
			dat = dat/100.
			datout = open('./ut_data-'+str(j)+'-'+outVar+'.json','w')
			print 'Writing ut_data-'+str(j)+'-'+outVar+'.json'
			rdat = dat[463:1028,167:854]
			print np.max(rdat[rdat<1e18])
			rflat = rcflat = np.ndarray(shape=(ghei-1,gwid+1))
			rflat[:,:-1] = rdat[:-1,:]
			rcflat[:,:-1] = rdat[1:,:]
			rflat[:,-1] = rcflat[:,-1] = 1e20
			mergerow = np.array([rflat.flatten(),rcflat.flatten()]).flatten('F')
			outstr = convertifyPrec(mergerow)
			sj = json.dumps({'a':outstr.tolist()},separators=(',',':'))
			datout.write(sj)
			datout.close()
			print time.time() - tm
			j+=1	
