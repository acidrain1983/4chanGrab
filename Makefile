all: 


clean:


clean_target:
	rm -f 4chanGrab.xpi

4chanGrab.xpi:
	cd ./4chanGrab; zip -r -D -9 ../$@ *

all: 4chanGrab.xpi


	